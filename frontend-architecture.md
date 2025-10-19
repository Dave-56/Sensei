Frontend Dashboard Pages:

Overview Page (Home)
Big number cards: Current health score, Active conversations, Failure rate today
Line chart: Health score trend over past 7 days
Alert feed: Recent failures with links to conversations
Top 5 usage patterns with sparklines

Conversations List
Table with: Conversation ID, Health Score (color-coded), Duration, Status, Time
Filters: Date range, Health score range, Has failures, Pattern type
Click any row → opens conversation detail modal
Bulk export selected conversations

Conversation Detail (Modal/Sidebar)
Full message thread with user/AI labels
Health score breakdown (what knocked off points)
Detected failures highlighted in timeline
Sentiment graph across conversation
"Similar conversations" section

Patterns Page
Card grid of discovered patterns
Each card: Pattern name, example quote, occurrence count, trend arrow
Click card → see all conversations in this pattern
"Emerging patterns" section for new behaviors

Failures Page
Kanban board style: Loops | Frustration | Nonsense | Abrupt Ends
Each card is a failed conversation
Drag to "Resolved" column after fixing
Failure trends chart at top

Settings
API keys management
Slack webhook configuration
Alert thresholds (when to trigger notifications)
Team members (using Supabase Auth)

Visual style:

Clean, minimal like Linear.app
Dark mode default (engineers love it)
Color coding: Green (healthy), Yellow (warning), Red (failure)
Lots of white space, no clutter
Every number clickable to drill down