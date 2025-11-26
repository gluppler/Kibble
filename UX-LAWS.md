# 🎨 LAWS OF UX :: DESIGN PRINCIPLES

A comprehensive collection of psychological principles and heuristics for creating exceptional user experiences.

**Source:** https://lawsofux.com/  
**Original Author:** Jon Yablonski

---

## 📚 CATEGORIES

The 21+ Laws of UX are organized into four main categories:

1. **Heuristics** - Mental shortcuts users take
2. **Gestalt Principles** - How we perceive visual patterns
3. **Cognitive Biases** - Systematic thinking patterns
4. **General Principles** - Foundational design guidelines

---

## 🧠 HEURISTICS

### 1. Jakob's Law

**Principle:** Users spend most of their time on other sites. They prefer your site to work the same way as all the other sites they already know.

**Application:**
- Design for familiarity, not uniqueness
- Use conventional navigation patterns (hamburger menus, top nav bars)
- Follow established UI conventions (shopping carts in top-right, search in header)

**Example:**
- **Google Meet** - Uses standard video call controls users expect from Zoom/Teams
- **Navigation bars** - Consistently placed at top or left across all websites
- **Shopping carts** - Always in top-right corner on e-commerce sites

**For Kibble:**
```typescript
// Use familiar kanban patterns
// ✅ DO: Vertical columns, drag-and-drop cards
// ❌ DON'T: Horizontal scrolling, click-to-move cards
```

---

### 2. Fitts's Law

**Principle:** The time to acquire a target is a function of the distance to and size of the target.

**Application:**
- Make important buttons large and easy to click
- Place frequently-used actions close to where users need them
- Increase touch target size on mobile (minimum 44x44px)
- Use adequate whitespace around clickable elements

**Example:**
- **Mobile keyboards** - Large keys for thumb-friendly typing
- **CTA buttons** - Primary actions are bigger than secondary ones
- **iOS bottom tabs** - Actions within thumb reach on large phones

**For Kibble:**
```typescript
// Button sizing hierarchy
<Button size="lg">Create Task</Button>        // Primary: large
<Button size="default">Edit</Button>          // Secondary: medium
<Button size="sm" variant="ghost">Cancel</Button> // Tertiary: small
```

---

### 3. Hick's Law

**Principle:** The time it takes to make a decision increases with the number and complexity of choices.

**Application:**
- Limit options to reduce cognitive load
- Break complex tasks into smaller steps
- Use progressive disclosure (show advanced options only when needed)
- Group related choices together

**Example:**
- **Google Meet** - Only shows 3-4 core controls during calls
- **Netflix** - Uses categories to chunk thousands of titles
- **Onboarding flows** - One question per screen

**For Kibble:**
```typescript
// Task creation: progressive disclosure
// Step 1: Title only
// Step 2: Add description (optional)
// Step 3: Assign & set due date (optional)
// Don't show all 10 fields at once
```

---

### 4. Miller's Law

**Principle:** The average person can only keep 7 (±2) items in their working memory.

**Application:**
- Chunk information into groups of 5-9 items
- Break long forms into steps
- Use categories and sections
- Display phone numbers in grouped format: (555) 123-4567

**Example:**
- **Phone numbers** - Grouped as (555) 123-4567, not 5551234567
- **Navigation menus** - 5-7 main items, rest in dropdowns
- **Credit cards** - 4 groups of 4 digits

**For Kibble:**
```typescript
// Kanban board: limit visible columns
const MAX_VISIBLE_COLUMNS = 5;
// If more, use horizontal scroll or tabs
```

---

### 5. Postel's Law (Robustness Principle)

**Principle:** Be liberal in what you accept from users, and conservative in what you send to them.

**Application:**
- Accept flexible input formats (dates, phone numbers, addresses)
- Provide consistent, predictable output
- Handle user errors gracefully
- Auto-format user input when possible

**Example:**
- **Search bars** - Accept "shirt large" or "large shirt" and understand both
- **Date inputs** - Accept 12/25/2024, 12-25-2024, Dec 25 2024
- **Forms** - Accept "US" or "United States" for country

**For Kibble:**
```typescript
// Accept flexible date inputs
const parseDate = (input: string) => {
  // Accepts: "tomorrow", "next monday", "12/25", "Dec 25"
  return dayjs(input, [
    'MM/DD/YYYY', 'MM-DD-YYYY', 'MMM DD', 'MMMM DD, YYYY'
  ]);
};
```

---

### 6. Doherty Threshold

**Principle:** Productivity soars when a computer and its users interact at a pace (<400ms) that ensures neither has to wait on the other.

**Application:**
- Keep interface response time under 400ms
- Show loading states for longer operations
- Use optimistic UI updates
- Implement skeleton screens instead of spinners

**Example:**
- **Twitter** - Shows tweet immediately, syncs in background
- **Slack** - Messages appear instantly with "sending..." indicator
- **GitHub** - Optimistic star count updates

**For Kibble:**
```typescript
// Optimistic UI for task creation
const createTask = async (data: TaskData) => {
  const tempId = generateTempId();
  
  // Add to UI immediately
  setTasks(prev => [...prev, { ...data, id: tempId }]);
  
  // Sync with server
  const result = await api.createTask(data);
  
  // Update with real ID
  setTasks(prev => prev.map(t => 
    t.id === tempId ? { ...t, id: result.id } : t
  ));
};
```

---

### 7. Goal-Gradient Effect

**Principle:** The tendency to approach a goal increases with proximity to the goal.

**Application:**
- Show progress bars on multi-step processes
- Display completion percentage
- Highlight remaining steps
- Celebrate milestones along the way

**Example:**
- **Dropbox onboarding** - "80% complete" checklist
- **LinkedIn profile** - Profile strength meter
- **Duolingo** - Progress bars for lessons with badges

**For Kibble:**
```typescript
// Onboarding checklist
<Card>
  <CardHeader>
    <CardTitle>Get Started (3/5 complete)</CardTitle>
    <Progress value={60} />
  </CardHeader>
  <CardContent>
    <Checklist>
      <ChecklistItem done>Create account ✓</ChecklistItem>
      <ChecklistItem done>Set up first board ✓</ChecklistItem>
      <ChecklistItem done>Create first task ✓</ChecklistItem>
      <ChecklistItem>Invite team member</ChecklistItem>
      <ChecklistItem>Add due dates</ChecklistItem>
    </Checklist>
  </CardContent>
</Card>
```

---

## 👁️ GESTALT PRINCIPLES

### 8. Law of Proximity

**Principle:** Objects that are near, or proximate to each other, tend to be grouped together.

**Application:**
- Group related elements close together
- Use whitespace to separate unrelated items
- Create visual relationships through spacing

**Example:**
- **Forms** - Related fields grouped together
- **Navigation** - Related menu items clustered
- **Cards** - Title, image, and description stay close

**For Kibble:**
```tsx
// Good: Related elements grouped
<TaskCard>
  <div className="space-y-1">
    <h3>Task Title</h3>
    <p className="text-muted">Description</p>
  </div>
  
  <div className="mt-4 space-x-2"> {/* Separate action area */}
    <Button>Edit</Button>
    <Button>Delete</Button>
  </div>
</TaskCard>
```

---

### 9. Law of Common Region

**Principle:** Elements within the same closed region are perceived as grouped together.

**Application:**
- Use borders, backgrounds, or cards to group content
- Create visual containers for related information
- Use subtle backgrounds to indicate sections

**Example:**
- **Cards** - Content grouped within bordered containers
- **Sections** - Background colors distinguish different areas
- **Modals** - Clear boundary separates from rest of page

**For Kibble:**
```tsx
// Use shadcn Card for grouping
<Card className="p-4">
  <CardHeader>
    <CardTitle>Backlog</CardTitle>
  </CardHeader>
  <CardContent className="space-y-2">
    {/* All tasks in this region belong to Backlog */}
    {tasks.map(task => <TaskCard key={task.id} {...task} />)}
  </CardContent>
</Card>
```

---

### 10. Law of Similarity

**Principle:** The human eye tends to perceive similar elements as a group or pattern.

**Application:**
- Use consistent styling for similar elements
- Color-code related items
- Use icons consistently
- Maintain visual hierarchy

**Example:**
- **Priority indicators** - Red = urgent, yellow = medium, green = low
- **Status badges** - Same shape/size, different colors
- **Button styles** - Primary buttons all look the same

**For Kibble:**
```tsx
// Consistent priority styling
const priorityColors = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500"
};

<Badge className={priorityColors[task.priority]}>
  {task.priority}
</Badge>
```

---

### 11. Law of Uniform Connectedness

**Principle:** Elements that are visually connected are perceived as more related than elements with no connection.

**Application:**
- Use lines to show relationships
- Connect related items visually
- Show flow with arrows or connectors

**Example:**
- **Flowcharts** - Lines connect related nodes
- **Timelines** - Vertical line connects events
- **Breadcrumbs** - Arrows show navigation path

**For Kibble:**
```tsx
// Visual connection between task and subtasks
<div className="space-y-2">
  <TaskCard {...parentTask} />
  <div className="ml-8 border-l-2 border-muted pl-4">
    {subtasks.map(subtask => (
      <TaskCard key={subtask.id} {...subtask} />
    ))}
  </div>
</div>
```

---

### 12. Law of Closure

**Principle:** The human brain tends to complete incomplete shapes or figures.

**Application:**
- Use negative space creatively
- Don't over-explain with visuals
- Trust users to "fill in the blanks"
- Minimalist icons work better than detailed ones

**Example:**
- **Logo design** - FedEx arrow, NBC peacock
- **Icons** - Simple outlines instead of detailed drawings
- **Loading indicators** - Partial circles imply full rotation

---

### 13. Law of Figure-Ground

**Principle:** The eye differentiates an object from its surrounding area.

**Application:**
- Use contrast to make important elements stand out
- Employ depth with shadows and layering
- Create clear visual hierarchy

**Example:**
- **Modals** - Dark overlay makes modal "pop forward"
- **Dropdowns** - Shadow separates from background
- **Hero sections** - Image background, text foreground

**For Kibble:**
```tsx
// Modal with clear figure-ground separation
<Dialog>
  <DialogOverlay className="bg-black/50" /> {/* Ground */}
  <DialogContent className="bg-white shadow-xl"> {/* Figure */}
    <DialogTitle>Edit Task</DialogTitle>
    {/* Content */}
  </DialogContent>
</Dialog>
```

---

## 🧩 COGNITIVE BIASES

### 14. Peak-End Rule

**Principle:** People judge an experience largely based on how they felt at its peak and at its end.

**Application:**
- Make onboarding delightful
- End interactions on a positive note
- Create memorable moments in the journey
- Nail the checkout/completion experience

**Example:**
- **Stripe** - Celebratory animation on successful payment
- **Mailchimp** - High-five animation when email sent
- **Duolingo** - Celebration screen after lesson completion

**For Kibble:**
```tsx
// Celebrate task completion
const completeTask = async (taskId: string) => {
  await api.completeTask(taskId);
  
  // Peak moment: confetti animation
  confetti();
  
  // End moment: positive feedback
  toast({
    title: "🎉 Task completed!",
    description: "Great work! Keep it up.",
  });
};
```

---

### 15. Serial Position Effect

**Principle:** Users remember the first and last items in a series better than the middle items.

**Application:**
- Place most important info at the beginning or end
- Put critical CTAs at start or end of forms
- Design navigation with key items on the edges
- Less important content can go in the middle

**Example:**
- **Navigation** - Home on far left, Account on far right
- **Forms** - Important fields first, optional ones last
- **Lists** - Featured items at top or bottom

**For Kibble:**
```tsx
// Important actions at edges
<div className="flex justify-between">
  <Button variant="default">Create Task</Button> {/* First */}
  <div className="space-x-2">
    <Button variant="ghost">Filter</Button>    {/* Middle */}
    <Button variant="ghost">Sort</Button>      {/* Middle */}
  </div>
  <Button variant="destructive">Clear All</Button> {/* Last */}
</div>
```

---

### 16. Aesthetic-Usability Effect

**Principle:** Users often perceive aesthetically pleasing design as more usable.

**Application:**
- Invest in visual design quality
- Use consistent color palette and typography
- Polish interactions with animations
- Beautiful ≠ usable, but beauty creates goodwill

**Example:**
- **Apple products** - Beautiful design creates perception of quality
- **Stripe dashboard** - Clean aesthetics inspire trust
- **Linear** - Gorgeous UI makes project management feel premium

**For Kibble:**
```tsx
// Use shadcn for polished components
// Add subtle animations for delight
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <TaskCard {...task} />
</motion.div>
```

---

### 17. Von Restorff Effect (Isolation Effect)

**Principle:** When multiple similar objects are present, the one that differs is most likely to be remembered.

**Application:**
- Make CTAs visually distinct
- Use color to highlight important elements
- Break patterns strategically
- Stand out where it matters

**Example:**
- **Primary button** - Bright color among neutral buttons
- **Error messages** - Red text stands out
- **New badges** - Highlight recently added features

**For Kibble:**
```tsx
// Make primary action stand out
<div className="space-x-2">
  <Button variant="ghost">Cancel</Button>
  <Button variant="outline">Save Draft</Button>
  <Button variant="default" size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
    Create Task ✨
  </Button>
</div>
```

---

### 18. Zeigarnik Effect

**Principle:** People remember uncompleted or interrupted tasks better than completed ones.

**Application:**
- Show unfinished tasks prominently
- Send reminders about incomplete actions
- Use "Continue where you left off" patterns
- Leverage FOMO for engagement

**Example:**
- **E-commerce** - "You didn't complete checkout!" emails
- **Netflix** - "Continue watching" row
- **Headspace** - Reminder to complete meditation streak

**For Kibble:**
```tsx
// Persistent incomplete task notification
{hasIncompleteTasks && (
  <Alert>
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>You have unfinished tasks</AlertTitle>
    <AlertDescription>
      3 tasks are waiting in your backlog.
      <Button variant="link">View now</Button>
    </AlertDescription>
  </Alert>
)}
```

---

## 📐 GENERAL PRINCIPLES

### 19. Pareto Principle (80/20 Rule)

**Principle:** Roughly 80% of effects come from 20% of causes.

**Application:**
- Focus on features that matter most to users
- Optimize the 20% of code that impacts 80% of performance
- Prioritize bugs that affect most users
- Don't over-engineer edge cases

**Example:**
- **Google** - Simple search box drives 80% of usage
- **Slack** - Messaging core, everything else secondary
- **Notion** - Most users only use 20% of features

**For Kibble:**
```typescript
// Focus on core kanban features first:
// ✅ Priority 1: Drag-and-drop, create/edit tasks, columns
// ⏸️ Priority 2: Comments, attachments, time tracking
// ⏸️ Priority 3: Advanced automation, integrations
```

---

### 20. Tesler's Law (Law of Conservation of Complexity)

**Principle:** For any system, there is a certain amount of complexity that cannot be reduced.

**Application:**
- Complexity can't be eliminated, only moved
- Either the system is complex, or the user experience is
- Simplify UI by handling complexity in the background
- Don't push complexity onto users

**Example:**
- **Google search** - Simple input, complex algorithms behind
- **iPhone** - Simple interface, complex tech inside
- **Netflix** - One-click play, complex streaming tech

**For Kibble:**
```typescript
// Hide Prisma/DB complexity from users
// Complex: Raw SQL queries
// Simple: One-click "Create Board"

// Behind the scenes:
await db.board.create({
  data: {
    name: "My Board",
    columns: {
      create: [
        { name: "Backlog", order: 0 },
        { name: "In Progress", order: 1 },
        { name: "Done", order: 2 }
      ]
    }
  }
});
// User sees: ✨ Board created instantly
```

---

### 21. Parkinson's Law

**Principle:** Work expands to fill the time available for its completion.

**Application:**
- Set time constraints on tasks
- Show estimated completion times
- Use timers for focus sessions
- Auto-save to prevent overthinking

**Example:**
- **Pomodoro timers** - 25-minute work blocks
- **Instagram Stories** - 24-hour expiration creates urgency
- **Flash sales** - Countdown timers drive action

**For Kibble:**
```tsx
// Estimated time for task creation
<DialogHeader>
  <DialogTitle>Create Task</DialogTitle>
  <DialogDescription>
    This should take about 30 seconds
  </DialogDescription>
</DialogHeader>
```

---

### 22. Occam's Razor

**Principle:** Among competing hypotheses that predict equally well, the one with fewest assumptions should be selected.

**Application:**
- Prefer simple solutions over complex ones
- Don't over-engineer
- Remove unnecessary features
- When in doubt, simplify

**Example:**
- **Basecamp** - Simple project management vs. Jira's complexity
- **iA Writer** - Minimalist text editor vs. Word
- **DuckDuckGo** - Simple search without tracking

**For Kibble:**
```typescript
// Simple state management
// ✅ DO: useState for local state
const [tasks, setTasks] = useState<Task[]>([]);

// ❌ DON'T: Redux for everything
// (unless you really need it)
```

---

## 🎯 APPLYING LAWS OF UX TO KIBBLE

### Kanban Board Design Checklist

**Jakob's Law:**
- ✅ Vertical columns (familiar kanban pattern)
- ✅ Drag-and-drop interactions
- ✅ Card-based task representation

**Fitts's Law:**
- ✅ Large drop zones for columns
- ✅ Big "Create Task" button
- ✅ Touch-friendly mobile interactions

**Hick's Law:**
- ✅ Limit to 3-5 visible columns
- ✅ Progressive disclosure for task details
- ✅ Simple task creation form

**Miller's Law:**
- ✅ Show 5-7 tasks per column max (with scroll)
- ✅ Chunk information in task cards

**Aesthetic-Usability Effect:**
- ✅ Use shadcn/ui for polished components
- ✅ Smooth dnd-kit animations
- ✅ Consistent color system

**Peak-End Rule:**
- ✅ Delightful onboarding
- ✅ Celebrate task completions
- ✅ Positive feedback on actions

---

## 🔌 INTEGRATION WITH KERNEL SYSTEM

```markdown
ACTIVATE: KERNEL.SYSTEM.ALL + UX.LAWS

When designing Kibble features, always consider:
1. Which UX laws apply to this interaction?
2. How can we reduce cognitive load? (Miller, Hick)
3. Is this interaction familiar? (Jakob)
4. Are important elements easy to reach? (Fitts)
5. Does the design look good AND work well? (Aesthetic-Usability)

Apply principles pragmatically, not dogmatically.
```

---

## 📚 REFERENCES

- **Laws of UX:** https://lawsofux.com/
- **Book:** "Laws of UX" by Jon Yablonski
- **Research:** Based on psychology, behavioral science, and cognitive studies

---

## 🧾 END OF UX LAWS

**Last Updated:** November 2024  
**Total Laws:** 22+ principles  
**Application:** Kibble Kanban Board

```
▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜
▌  UX LAWS LOADED                         ▐
▌  Design with psychology in mind         ▐
▌  Create experiences that feel natural   ▐
▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟
```
