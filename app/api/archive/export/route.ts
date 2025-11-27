/**
 * Archive Export API Route
 * 
 * Exports archived boards or tasks to CSV format.
 * 
 * Security:
 * - Requires authentication
 * - Only exports user's own archived items
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerAuthSession } from "@/server/auth";
import { checkAuthentication } from "@/lib/permissions";

// Optimize for Vercel serverless
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Escape CSV field value
 */
function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * GET /api/archive/export
 * 
 * Exports archived items to CSV
 * Query params:
 * - type: "boards" | "tasks"
 */
export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession();

    const authCheck = checkAuthentication(session);
    if (!authCheck.allowed || !session?.user?.id) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.statusCode || 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "tasks";

    if (type === "boards") {
      // Export archived boards
      const boards = await db.board.findMany({
        where: {
          userId: session.user.id,
          archived: true,
        },
        include: {
          columns: {
            include: {
              tasks: {
                where: {
                  archived: false,
                },
              },
            },
          },
        },
        orderBy: { archivedAt: "desc" },
      });

      // Generate CSV
      const csvRows: string[] = [];
      csvRows.push("Board Title,Archived Date,Created Date,Column Count,Task Count");

      for (const board of boards) {
        const taskCount = board.columns.reduce((sum, col) => sum + col.tasks.length, 0);
        csvRows.push(
          [
            escapeCsvField(board.title),
            escapeCsvField(board.archivedAt?.toISOString() || ""),
            escapeCsvField(board.createdAt.toISOString()),
            escapeCsvField(String(board.columns.length)),
            escapeCsvField(String(taskCount)),
          ].join(",")
        );
      }

      const csv = csvRows.join("\n");
      const filename = `kibble-archived-boards-${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      // Export archived tasks
      const tasks = await db.task.findMany({
        where: {
          archived: true,
          column: {
            board: {
              userId: session.user.id,
            },
          },
        },
        include: {
          column: {
            include: {
              board: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { archivedAt: "desc" },
      });

      // Generate CSV
      const csvRows: string[] = [];
      csvRows.push("Task Title,Description,Due Date,Board,Column,Archived Date,Created Date");

      for (const task of tasks) {
        csvRows.push(
          [
            escapeCsvField(task.title),
            escapeCsvField(task.description || ""),
            escapeCsvField(task.dueDate?.toISOString() || ""),
            escapeCsvField(task.column.board.title),
            escapeCsvField(task.column.title),
            escapeCsvField(task.archivedAt?.toISOString() || ""),
            escapeCsvField(task.createdAt.toISOString()),
          ].join(",")
        );
      }

      const csv = csvRows.join("\n");
      const filename = `kibble-archived-tasks-${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting archive:", error);
    return NextResponse.json(
      { error: "Failed to export archive" },
      { status: 500 }
    );
  }
}
