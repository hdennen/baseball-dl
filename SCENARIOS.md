# User Scenarios

Organized by persona. Each scenario describes a user goal and the expected behavior. Scenarios marked **(implemented)** reflect current app behavior; **(planned)** indicates future work.

---

## Personas

### Coach
Head coach or assistant coach. Primary user of the app. Creates lineups, manages rosters, and runs games. May or may not be tech-savvy -- the app should get out of the way and let them focus on the game.

### Player Relative
Parent or guardian of a player on the team. Interested in seeing their child's lineup, position assignments, and game schedule. May be invited to the team by a coach.

---

## Coach Scenarios

### Quick Start (No Account)

1. **Add players without signing in** (implemented)
   A coach visits the app for the first time, goes to the Batting Order tab, and adds players by name. No login required. Data persists in localStorage so they can close the browser and come back.

2. **Set batting order** (implemented)
   After adding players, the coach drags players into the batting order or uses the add/remove controls. The order is preserved across sessions.

3. **Assign defensive positions** (implemented)
   The coach navigates to the Lineup Editor tab, selects an inning, and drags players from the bench to field positions. Positions are per-inning.

4. **Add and manage innings** (implemented)
   The coach adds innings (empty or carry-over from previous). They can reorder and remove innings. Maximum of 9 innings.

5. **Auto-generate positions** (implemented)
   The coach uses the "Generate" feature to randomly assign available players to all positions for one or all innings.

6. **Configure field layout** (implemented)
   The coach toggles center outfield options (single center fielder, or center-left/center-right split) per inning.

7. **View all innings summary** (implemented)
   The coach goes to the All Innings Summary tab to see a grid of every player's position in every inning at a glance.

8. **Print lineup** (implemented)
   The coach prints the lineup from the browser. Print-specific views (field diagram, batting order card, box score) render cleanly without UI chrome.

### Team Management

9. **Create a team** (implemented)
   A signed-in coach goes to the Team tab, clicks "New Team," enters a name, and the team is created. The team is now selectable from the dropdown.

10. **Import local roster into a new team** (implemented)
    A coach who has been using the app without a team (local mode) creates a new team. The app detects existing players/lineup data and offers to import them into the new team. If accepted, players are created on the team via the API and all local ID references (batting order, inning positions, unavailable players) are remapped to the server-generated UUIDs. No lineup data is lost.

11. **Decline import and start fresh** (implemented)
    Same as above, but the coach chooses "Start Fresh." The local data is cleared and the team starts with an empty roster.

12. **Manage team roster** (implemented)
    With a team selected, the coach adds and removes players from the Team tab. Changes go through the API. The roster is auto-synced to the Zustand store so the Batting Order and Lineup tabs reflect the current roster.

13. **Switch between teams** (implemented)
    A coach with multiple teams uses the Team tab dropdown to switch. Switching teams resets the batting order and innings since player IDs differ between teams.

14. **Return to local mode** (implemented)
    A coach deselects their team (chooses "None / local mode" in the dropdown). The app reverts to local-only behavior with an empty roster. The team's data is preserved on the server for when they reselect it.

### Game Day

15. **Set game context** (implemented)
    The coach enters game metadata (date, time, opponent, location, home/away, notes) on the Batting Order tab. This context appears on printed views.

16. **Mark players unavailable** (implemented)
    The coach toggles player availability. Unavailable players are removed from the batting order and all inning position assignments.

17. **Fill remaining positions** (implemented)
    After manually placing key players, the coach uses "Fill Remaining" to auto-assign unplaced available players to open positions in the current inning.

### Account

18. **Sign in** (implemented)
    The coach signs in via Stytch (passwordless email link). Authentication state is shown in the header.

19. **Sign out** (implemented)
    The coach clicks Logout. Session is revoked. The Team tab shows a sign-in prompt; other tabs continue to work in local mode.

### Future Coach Scenarios

20. **Save multiple lineups per team** (planned)
    The data model supports multiple lineups per team. The coach will be able to save, name, and switch between lineups for different games.

21. **Invite assistant coaches** (planned)
    A head coach invites another user as an assistant coach on the team. The assistant can view and edit lineups.

22. **Purchase a season** (planned)
    A coach purchases a season via Stripe one-time payment. This unlocks cloud persistence and print functionality for that season.

---

## Player Relative Scenarios

### Viewing

23. **View child's lineup** (planned)
    A parent who has been added to a team can see the published lineup for an upcoming game, including their child's position each inning and batting order slot.

24. **See game schedule** (planned)
    A parent views the list of upcoming games (derived from lineup game contexts) for their child's team.

### Team Membership

25. **Accept team invite** (planned)
    A coach sends an invite link. The parent clicks it, signs in (or creates an account), and is added to the team as a "parent" member.

26. **Link to player** (planned)
    After joining a team, the parent links their account to their child's player record via a player relationship. This enables player-specific views.

### Future Relative Scenarios

27. **Sponsor a season for a coach** (planned)
    A parent purchases a season on behalf of the coach (sponsor link). The coach gets cloud persistence without paying themselves.

28. **Receive lineup notifications** (planned)
    When the coach publishes a lineup, parents on the team receive a notification (email or push) with their child's assignments.
