/**
 * GitAtlas — Interactive Git Graph & Branch Visualizer Simulator
 * Zero-dependency interactive SVG DAG graph engine with guided step-by-step
 * branch workflows and a full interactive sandbox.
 */

(function () {
  'use strict';

  /* =========================================================
     Color Palette & Constants
     ========================================================= */
  var PALETTE = {
    main: '#58a6ff',      // Blue
    feature: '#bc8cff',   // Purple
    hotfix: '#f0883e',    // Orange
    release: '#3fb950',   // Green
    orphan: '#8b949e',    // Gray / Dim
    danger: '#f85149',    // Red
    cherry: '#d29922',    // Amber / Yellow
    head: '#58a6ff'
  };

  /* =========================================================
     Pre-built Scenarios
     ========================================================= */
  var SCENARIOS = [
    {
      id: 'merge',
      title: 'git merge (3-Way Merge)',
      subtitle: 'Joining divergent branches by creating a merge commit with two parents.',
      category: 'branching',
      steps: [
        {
          title: 'Initial State: Divergent Branches',
          cmd: 'git checkout main',
          why: 'You are on the "main" branch. Both "main" and "feat/login" have new commits that branched off commit C2.',
          tip: 'Notice C3 and C4 on "feat/login", and C5 on "main". Both have progressed independently.',
          graph: {
            nodes: [
              { id: 'c1', sha: 'e1a4b9', msg: 'Initial project setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '7f3c21', msg: 'Add auth routes skeleton', branch: 'main', x: 160, y: 100, parents: ['c1'] },
              { id: 'c3', sha: '9a01fd', msg: 'Create login page UI', branch: 'feat/login', x: 260, y: 190, parents: ['c2'] },
              { id: 'c4', sha: '3b82cc', msg: 'Add JWT token handler', branch: 'feat/login', x: 370, y: 190, parents: ['c3'] },
              { id: 'c5', sha: '5e44a0', msg: 'Update database schema', branch: 'main', x: 370, y: 100, parents: ['c2'] }
            ],
            branches: [
              { name: 'feat/login', target: 'c4', color: PALETTE.feature },
              { name: 'main', target: 'c5', color: PALETTE.main }
            ],
            head: { type: 'branch', target: 'main' }
          }
        },
        {
          title: 'Run git merge feat/login',
          cmd: 'git merge feat/login -m "Merge branch feat/login into main"',
          why: 'Git creates a new merge commit C6 on "main" that combines changes from both C5 and C4.',
          tip: 'C6 is special: it has two parent commits (C5 and C4). History remains non-linear and preserves exact author history.',
          graph: {
            nodes: [
              { id: 'c1', sha: 'e1a4b9', msg: 'Initial project setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '7f3c21', msg: 'Add auth routes skeleton', branch: 'main', x: 160, y: 100, parents: ['c1'] },
              { id: 'c3', sha: '9a01fd', msg: 'Create login page UI', branch: 'feat/login', x: 260, y: 190, parents: ['c2'] },
              { id: 'c4', sha: '3b82cc', msg: 'Add JWT token handler', branch: 'feat/login', x: 370, y: 190, parents: ['c3'] },
              { id: 'c5', sha: '5e44a0', msg: 'Update database schema', branch: 'main', x: 370, y: 100, parents: ['c2'] },
              { id: 'c6', sha: '8c10fa', msg: 'Merge branch feat/login into main', branch: 'main', x: 490, y: 100, parents: ['c5', 'c4'], isNew: true, isMerge: true }
            ],
            branches: [
              { name: 'feat/login', target: 'c4', color: PALETTE.feature },
              { name: 'main', target: 'c6', color: PALETTE.main }
            ],
            head: { type: 'branch', target: 'main' }
          }
        },
        {
          title: 'Clean Up Merged Feature Branch',
          cmd: 'git branch -d feat/login',
          why: 'The feature is now safely integrated into "main". You can delete the local branch pointer without losing any commits.',
          tip: 'Deleting a branch only deletes the pointer label. All commits (C3, C4, C6) remain in the history of "main".',
          graph: {
            nodes: [
              { id: 'c1', sha: 'e1a4b9', msg: 'Initial project setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '7f3c21', msg: 'Add auth routes skeleton', branch: 'main', x: 160, y: 100, parents: ['c1'] },
              { id: 'c3', sha: '9a01fd', msg: 'Create login page UI', branch: 'main', x: 260, y: 190, parents: ['c2'] },
              { id: 'c4', sha: '3b82cc', msg: 'Add JWT token handler', branch: 'main', x: 370, y: 190, parents: ['c3'] },
              { id: 'c5', sha: '5e44a0', msg: 'Update database schema', branch: 'main', x: 370, y: 100, parents: ['c2'] },
              { id: 'c6', sha: '8c10fa', msg: 'Merge branch feat/login into main', branch: 'main', x: 490, y: 100, parents: ['c5', 'c4'], isMerge: true }
            ],
            branches: [
              { name: 'main', target: 'c6', color: PALETTE.main }
            ],
            head: { type: 'branch', target: 'main' }
          }
        }
      ]
    },
    {
      id: 'rebase',
      title: 'git rebase (Linear History)',
      subtitle: 'Lifting feature commits and replaying them on top of target branch with brand-new SHAs.',
      category: 'rebasing',
      steps: [
        {
          title: 'Initial State: Feature Behind Main',
          cmd: 'git checkout feat/login',
          why: 'You are on "feat/login". While you were working on C3 & C4, team members pushed C5 to "main".',
          tip: 'Your branch is out of date. Instead of a messy merge commit, rebase will make your history completely linear.',
          graph: {
            nodes: [
              { id: 'c1', sha: 'e1a4b9', msg: 'Initial setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '7f3c21', msg: 'Base layout', branch: 'main', x: 160, y: 100, parents: ['c1'] },
              { id: 'c3', sha: '9a01fd', msg: 'Login form component', branch: 'feat/login', x: 260, y: 190, parents: ['c2'] },
              { id: 'c4', sha: '3b82cc', msg: 'Validate password strength', branch: 'feat/login', x: 370, y: 190, parents: ['c3'] },
              { id: 'c5', sha: '5e44a0', msg: 'Database optimizations', branch: 'main', x: 280, y: 100, parents: ['c2'] }
            ],
            branches: [
              { name: 'feat/login', target: 'c4', color: PALETTE.feature },
              { name: 'main', target: 'c5', color: PALETTE.main }
            ],
            head: { type: 'branch', target: 'feat/login' }
          }
        },
        {
          title: 'Rebase: Lift & Replay First Commit (C3 -> C3\')',
          cmd: 'git rebase main',
          why: 'Git unwinds your branch and replays C3 directly on top of C5, producing new commit C3\' (different hash!).',
          tip: 'Because C3\' now has C5 as its parent instead of C2, its commit SHA changes completely.',
          graph: {
            nodes: [
              { id: 'c1', sha: 'e1a4b9', msg: 'Initial setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '7f3c21', msg: 'Base layout', branch: 'main', x: 160, y: 100, parents: ['c1'] },
              { id: 'c5', sha: '5e44a0', msg: 'Database optimizations', branch: 'main', x: 270, y: 100, parents: ['c2'] },
              { id: 'c3_new', sha: 'fa92e1', msg: 'Login form component (rebased)', branch: 'feat/login', x: 380, y: 100, parents: ['c5'], isNew: true, isRebased: true },
              { id: 'c3', sha: '9a01fd', msg: 'Old C3 (abandoned)', branch: 'feat/login', x: 260, y: 190, parents: ['c2'], isOrphan: true },
              { id: 'c4', sha: '3b82cc', msg: 'Old C4 (pending)', branch: 'feat/login', x: 370, y: 190, parents: ['c3'], isOrphan: true }
            ],
            branches: [
              { name: 'main', target: 'c5', color: PALETTE.main },
              { name: 'feat/login', target: 'c3_new', color: PALETTE.feature }
            ],
            head: { type: 'branch', target: 'feat/login' }
          }
        },
        {
          title: 'Replay Second Commit (C4 -> C4\')',
          cmd: '# Git finishes replaying all commits',
          why: 'Git replays C4 on top of C3\' as C4\'. The branch now sits directly ahead of "main" in a straight line.',
          tip: 'Old commits C3 and C4 are detached and will be cleaned up by garbage collection. History is 100% linear!',
          graph: {
            nodes: [
              { id: 'c1', sha: 'e1a4b9', msg: 'Initial setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '7f3c21', msg: 'Base layout', branch: 'main', x: 160, y: 100, parents: ['c1'] },
              { id: 'c5', sha: '5e44a0', msg: 'Database optimizations', branch: 'main', x: 270, y: 100, parents: ['c2'] },
              { id: 'c3_new', sha: 'fa92e1', msg: 'Login form component', branch: 'feat/login', x: 380, y: 100, parents: ['c5'], isRebased: true },
              { id: 'c4_new', sha: 'b185d3', msg: 'Validate password strength', branch: 'feat/login', x: 490, y: 100, parents: ['c3_new'], isNew: true, isRebased: true }
            ],
            branches: [
              { name: 'main', target: 'c5', color: PALETTE.main },
              { name: 'feat/login', target: 'c4_new', color: PALETTE.feature }
            ],
            head: { type: 'branch', target: 'feat/login' }
          }
        },
        {
          title: 'Fast-Forward Merge into Main',
          cmd: 'git checkout main && git merge feat/login',
          why: 'Because "feat/login" is directly ahead of "main", Git simply moves the "main" pointer forward with zero merge commits.',
          tip: 'This is called a Fast-Forward merge (`--ff`). History stays pristine and easy to read with `git log --oneline`.',
          graph: {
            nodes: [
              { id: 'c1', sha: 'e1a4b9', msg: 'Initial setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '7f3c21', msg: 'Base layout', branch: 'main', x: 160, y: 100, parents: ['c1'] },
              { id: 'c5', sha: '5e44a0', msg: 'Database optimizations', branch: 'main', x: 270, y: 100, parents: ['c2'] },
              { id: 'c3_new', sha: 'fa92e1', msg: 'Login form component', branch: 'main', x: 380, y: 100, parents: ['c5'] },
              { id: 'c4_new', sha: 'b185d3', msg: 'Validate password strength', branch: 'main', x: 490, y: 100, parents: ['c3_new'] }
            ],
            branches: [
              { name: 'feat/login', target: 'c4_new', color: PALETTE.feature },
              { name: 'main', target: 'c4_new', color: PALETTE.main }
            ],
            head: { type: 'branch', target: 'main' }
          }
        }
      ]
    },
    {
      id: 'squash',
      title: 'git merge --squash (Collapse WIPs)',
      subtitle: 'Condensing multiple messy WIP commits into one clean, atomic commit on the target branch.',
      category: 'merging',
      steps: [
        {
          title: 'Initial State: Feature with Granular WIPs',
          cmd: 'git checkout main',
          why: 'You have a feature branch with 4 messy commits: "wip", "fix typo", "more tests", "finished".',
          tip: 'You want all the code changes on "main", but without cluttering "main" history with WIP commits.',
          graph: {
            nodes: [
              { id: 'c1', sha: '11a2b3', msg: 'Release v1.0', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '22b3c4', msg: 'Hotfix cors headers', branch: 'main', x: 160, y: 100, parents: ['c1'] },
              { id: 'c3', sha: '33c4d5', msg: 'wip auth logic', branch: 'feat/oauth', x: 260, y: 190, parents: ['c2'] },
              { id: 'c4', sha: '44d5e6', msg: 'fix typo in token parser', branch: 'feat/oauth', x: 360, y: 190, parents: ['c3'] },
              { id: 'c5', sha: '55e6f7', msg: 'add unit test mock', branch: 'feat/oauth', x: 460, y: 190, parents: ['c4'] },
              { id: 'c6', sha: '66f7a8', msg: 'lint fix & cleanup', branch: 'feat/oauth', x: 560, y: 190, parents: ['c5'] }
            ],
            branches: [
              { name: 'main', target: 'c2', color: PALETTE.main },
              { name: 'feat/oauth', target: 'c6', color: PALETTE.feature }
            ],
            head: { type: 'branch', target: 'main' }
          }
        },
        {
          title: 'Stage All Changes as One Tree',
          cmd: 'git merge --squash feat/oauth',
          why: 'Git combines all changes from C3, C4, C5, and C6 and stages them in the staging area (index) without committing yet.',
          tip: 'No commit has been created yet. You now have a chance to review staged files with `git status` or `git diff --staged`.',
          graph: {
            nodes: [
              { id: 'c1', sha: '11a2b3', msg: 'Release v1.0', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '22b3c4', msg: 'Hotfix cors headers', branch: 'main', x: 160, y: 100, parents: ['c1'] },
              { id: 'c3', sha: '33c4d5', msg: 'wip auth logic', branch: 'feat/oauth', x: 260, y: 190, parents: ['c2'] },
              { id: 'c4', sha: '44d5e6', msg: 'fix typo in token parser', branch: 'feat/oauth', x: 360, y: 190, parents: ['c3'] },
              { id: 'c5', sha: '55e6f7', msg: 'add unit test mock', branch: 'feat/oauth', x: 460, y: 190, parents: ['c4'] },
              { id: 'c6', sha: '66f7a8', msg: 'lint fix & cleanup', branch: 'feat/oauth', x: 560, y: 190, parents: ['c5'] }
            ],
            branches: [
              { name: 'main', target: 'c2', color: PALETTE.main },
              { name: 'feat/oauth', target: 'c6', color: PALETTE.feature }
            ],
            head: { type: 'branch', target: 'main' }
          }
        },
        {
          title: 'Commit the Atomic Feature Commit',
          cmd: 'git commit -m "feat(auth): implement OAuth2 Google & GitHub sign-in"',
          why: 'Creates a single clean commit C7 on "main". Notice C7 has only ONE parent (C2), keeping "main" graph flat and clean.',
          tip: 'This is the standard merge strategy for GitHub Pull Requests ("Squash and merge").',
          graph: {
            nodes: [
              { id: 'c1', sha: '11a2b3', msg: 'Release v1.0', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '22b3c4', msg: 'Hotfix cors headers', branch: 'main', x: 160, y: 100, parents: ['c1'] },
              { id: 'c7', sha: '77a8b9', msg: 'feat(auth): implement OAuth2 Google & GitHub sign-in', branch: 'main', x: 280, y: 100, parents: ['c2'], isNew: true, isSquash: true },
              { id: 'c3', sha: '33c4d5', msg: 'wip auth logic', branch: 'feat/oauth', x: 260, y: 190, parents: ['c2'], isOrphan: true },
              { id: 'c4', sha: '44d5e6', msg: 'fix typo in token parser', branch: 'feat/oauth', x: 360, y: 190, parents: ['c3'], isOrphan: true },
              { id: 'c5', sha: '55e6f7', msg: 'add unit test mock', branch: 'feat/oauth', x: 460, y: 190, parents: ['c4'], isOrphan: true },
              { id: 'c6', sha: '66f7a8', msg: 'lint fix & cleanup', branch: 'feat/oauth', x: 560, y: 190, parents: ['c5'], isOrphan: true }
            ],
            branches: [
              { name: 'main', target: 'c7', color: PALETTE.main },
              { name: 'feat/oauth', target: 'c6', color: PALETTE.feature }
            ],
            head: { type: 'branch', target: 'main' }
          }
        }
      ]
    },
    {
      id: 'cherrypick',
      title: 'git cherry-pick (Surgical Copy)',
      subtitle: 'Copying a single specific commit from another branch onto your active branch.',
      category: 'advanced',
      steps: [
        {
          title: 'Initial State: Bugfix Needed on Release Branch',
          cmd: 'git checkout main',
          why: 'You are on "main" preparing for release. On branch "dev-branch", commit C4 contains a critical bugfix you need right now.',
          tip: 'You do NOT want to merge all of "dev-branch" (C3 is unfinished experimental work). You only want C4.',
          graph: {
            nodes: [
              { id: 'c1', sha: 'aa1122', msg: 'Core framework init', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: 'bb2233', msg: 'Stable release candidate', branch: 'main', x: 170, y: 100, parents: ['c1'] },
              { id: 'c3', sha: 'cc3344', msg: 'Experimental 3D engine (WIP)', branch: 'dev-branch', x: 280, y: 190, parents: ['c2'] },
              { id: 'c4', sha: 'dd4455', msg: 'Fix memory leak in image loader', branch: 'dev-branch', x: 400, y: 190, parents: ['c3'] }
            ],
            branches: [
              { name: 'main', target: 'c2', color: PALETTE.main },
              { name: 'dev-branch', target: 'c4', color: PALETTE.feature }
            ],
            head: { type: 'branch', target: 'main' }
          }
        },
        {
          title: 'Cherry-Pick Commit dd4455',
          cmd: 'git cherry-pick dd4455',
          why: 'Git copies the exact diff from commit C4 and applies it as a new commit C4\' on top of "main".',
          tip: 'Commit C4\' gets a new SHA (e.g. `ee5566`) because its parent is C2 instead of C3. C3 remains on "dev-branch".',
          graph: {
            nodes: [
              { id: 'c1', sha: 'aa1122', msg: 'Core framework init', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: 'bb2233', msg: 'Stable release candidate', branch: 'main', x: 170, y: 100, parents: ['c1'] },
              { id: 'c4_cherry', sha: 'ee5566', msg: 'Fix memory leak in image loader', branch: 'main', x: 290, y: 100, parents: ['c2'], isNew: true, isCherry: true },
              { id: 'c3', sha: 'cc3344', msg: 'Experimental 3D engine (WIP)', branch: 'dev-branch', x: 280, y: 190, parents: ['c2'] },
              { id: 'c4', sha: 'dd4455', msg: 'Fix memory leak in image loader', branch: 'dev-branch', x: 400, y: 190, parents: ['c3'] }
            ],
            branches: [
              { name: 'main', target: 'c4_cherry', color: PALETTE.main },
              { name: 'dev-branch', target: 'c4', color: PALETTE.feature }
            ],
            head: { type: 'branch', target: 'main' }
          }
        }
      ]
    },
    {
      id: 'detached',
      title: 'Detached HEAD & Reflog Rescue',
      subtitle: 'What happens when HEAD points directly to a commit instead of a branch, and how to rescue orphan commits.',
      category: 'recovery',
      steps: [
        {
          title: 'Normal State: HEAD Attached to Main',
          cmd: 'git checkout main',
          why: 'In normal Git usage, HEAD points to a branch name (e.g., "main"), which in turn points to the latest commit C3.',
          tip: 'When you make commits now, the "main" pointer automatically moves forward with you.',
          graph: {
            nodes: [
              { id: 'c1', sha: '10a1b2', msg: 'Initial setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '20b2c3', msg: 'Add payment gateway', branch: 'main', x: 170, y: 100, parents: ['c1'] },
              { id: 'c3', sha: '30c3d4', msg: 'Add stripe webhooks', branch: 'main', x: 280, y: 100, parents: ['c2'] }
            ],
            branches: [
              { name: 'main', target: 'c3', color: PALETTE.main }
            ],
            head: { type: 'branch', target: 'main' }
          }
        },
        {
          title: 'Checkout a Commit Hash (Detaching HEAD)',
          cmd: 'git checkout 20b2c3',
          why: 'HEAD now points directly to commit C2 rather than a branch. Git shows a "You are in detached HEAD state" warning.',
          tip: 'Detached HEAD is great for inspecting older versions or running tests at an exact point in time.',
          graph: {
            nodes: [
              { id: 'c1', sha: '10a1b2', msg: 'Initial setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '20b2c3', msg: 'Add payment gateway', branch: 'main', x: 170, y: 100, parents: ['c1'] },
              { id: 'c3', sha: '30c3d4', msg: 'Add stripe webhooks', branch: 'main', x: 280, y: 100, parents: ['c2'] }
            ],
            branches: [
              { name: 'main', target: 'c3', color: PALETTE.main }
            ],
            head: { type: 'commit', target: 'c2', isDetached: true }
          }
        },
        {
          title: 'Making a Commit while Detached',
          cmd: 'git commit -m "Experimental payment prototype"',
          why: 'New commit C4 is created with parent C2, but NO branch pointer points to it. Only HEAD points to C4.',
          tip: 'If you switch branches now without creating a branch label, C4 will be left behind!',
          graph: {
            nodes: [
              { id: 'c1', sha: '10a1b2', msg: 'Initial setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '20b2c3', msg: 'Add payment gateway', branch: 'main', x: 170, y: 100, parents: ['c1'] },
              { id: 'c3', sha: '30c3d4', msg: 'Add stripe webhooks', branch: 'main', x: 280, y: 100, parents: ['c2'] },
              { id: 'c4', sha: '40d4e5', msg: 'Experimental payment prototype', branch: 'detached', x: 280, y: 190, parents: ['c2'], isNew: true }
            ],
            branches: [
              { name: 'main', target: 'c3', color: PALETTE.main }
            ],
            head: { type: 'commit', target: 'c4', isDetached: true }
          }
        },
        {
          title: 'Switching Back: C4 Becomes an Orphan Commit!',
          cmd: 'git checkout main',
          why: 'HEAD moves back to "main". Commit C4 is now an "orphan / dangling" commit with no branch reference pointing to it.',
          tip: 'Don\'t panic! Git does NOT delete C4 immediately. It remains in your local object database for at least 30-90 days.',
          graph: {
            nodes: [
              { id: 'c1', sha: '10a1b2', msg: 'Initial setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '20b2c3', msg: 'Add payment gateway', branch: 'main', x: 170, y: 100, parents: ['c1'] },
              { id: 'c3', sha: '30c3d4', msg: 'Add stripe webhooks', branch: 'main', x: 280, y: 100, parents: ['c2'] },
              { id: 'c4', sha: '40d4e5', msg: 'Experimental prototype (Orphaned)', branch: 'orphaned', x: 280, y: 190, parents: ['c2'], isOrphan: true }
            ],
            branches: [
              { name: 'main', target: 'c3', color: PALETTE.main }
            ],
            head: { type: 'branch', target: 'main' }
          }
        },
        {
          title: 'Rescue Orphan with git reflog & git branch',
          cmd: 'git reflog\n# Find hash 40d4e5\ngit branch feat/prototype 40d4e5',
          why: '`git reflog` lists every movement of HEAD. You find C4\'s hash and attach a new branch name to it.',
          tip: 'The orphan commit is now fully rescued and safely attached to the new branch "feat/prototype"!',
          graph: {
            nodes: [
              { id: 'c1', sha: '10a1b2', msg: 'Initial setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: '20b2c3', msg: 'Add payment gateway', branch: 'main', x: 170, y: 100, parents: ['c1'] },
              { id: 'c3', sha: '30c3d4', msg: 'Add stripe webhooks', branch: 'main', x: 280, y: 100, parents: ['c2'] },
              { id: 'c4', sha: '40d4e5', msg: 'Experimental prototype (Rescued!)', branch: 'feat/prototype', x: 280, y: 190, parents: ['c2'], isNew: true }
            ],
            branches: [
              { name: 'main', target: 'c3', color: PALETTE.main },
              { name: 'feat/prototype', target: 'c4', color: PALETTE.feature }
            ],
            head: { type: 'branch', target: 'main' }
          }
        }
      ]
    },
    {
      id: 'reset',
      title: 'git reset (--soft vs --mixed vs --hard)',
      subtitle: 'Moving the branch pointer backward and controlling what happens to uncommitted work.',
      category: 'undo',
      steps: [
        {
          title: 'Initial State: Accidental Commit C3',
          cmd: 'git log --oneline -n 3',
          why: 'You are on "main" at commit C3. You realize C3 contained secrets or broken code and you want to undo it.',
          tip: '`git reset` moves your branch pointer backward. The flag you choose decides what happens to files from C3.',
          graph: {
            nodes: [
              { id: 'c1', sha: 'f102a3', msg: 'Initial setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: 'f203b4', msg: 'Working feature code', branch: 'main', x: 180, y: 100, parents: ['c1'] },
              { id: 'c3', sha: 'f304c5', msg: 'Mistake: committed .env secret', branch: 'main', x: 300, y: 100, parents: ['c2'], isDanger: true }
            ],
            branches: [
              { name: 'main', target: 'c3', color: PALETTE.main }
            ],
            head: { type: 'branch', target: 'main' }
          }
        },
        {
          title: 'Option A: git reset --soft HEAD~1',
          cmd: 'git reset --soft HEAD~1',
          why: 'Moves "main" back to C2. All changes from C3 stay STAGED in the index (ready for `git commit`).',
          tip: 'Use `--soft` when you want to change the commit message or split changes into multiple commits.',
          graph: {
            nodes: [
              { id: 'c1', sha: 'f102a3', msg: 'Initial setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: 'f203b4', msg: 'Working feature code', branch: 'main', x: 180, y: 100, parents: ['c1'] },
              { id: 'c3', sha: 'f304c5', msg: 'Undone commit (Changes STAGED)', branch: 'main', x: 300, y: 100, parents: ['c2'], isOrphan: true }
            ],
            branches: [
              { name: 'main', target: 'c2', color: PALETTE.main }
            ],
            head: { type: 'branch', target: 'main' }
          }
        },
        {
          title: 'Option B: git reset --mixed HEAD~1 (Default)',
          cmd: 'git reset HEAD~1',
          why: 'Moves "main" back to C2. Changes from C3 remain in your WORKING DIRECTORY as UNSTAGED modified files.',
          tip: 'This is the default if you omit flags. Your file edits are safe in editor, but unstaged from Git.',
          graph: {
            nodes: [
              { id: 'c1', sha: 'f102a3', msg: 'Initial setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: 'f203b4', msg: 'Working feature code', branch: 'main', x: 180, y: 100, parents: ['c1'] },
              { id: 'c3', sha: 'f304c5', msg: 'Undone commit (Changes in files)', branch: 'main', x: 300, y: 100, parents: ['c2'], isOrphan: true }
            ],
            branches: [
              { name: 'main', target: 'c2', color: PALETTE.main }
            ],
            head: { type: 'branch', target: 'main' }
          }
        },
        {
          title: 'Option C: git reset --hard HEAD~1 (Destructive)',
          cmd: 'git reset --hard HEAD~1',
          why: 'Moves "main" back to C2 AND completely wipes all modified files in working directory from C3.',
          tip: '⚠️ DANGER: Any uncommitted changes are permanently lost. Check `git status` before running `--hard`.',
          graph: {
            nodes: [
              { id: 'c1', sha: 'f102a3', msg: 'Initial setup', branch: 'main', x: 60, y: 100 },
              { id: 'c2', sha: 'f203b4', msg: 'Working feature code', branch: 'main', x: 180, y: 100, parents: ['c1'] },
              { id: 'c3', sha: 'f304c5', msg: 'Undone commit (Destroyed)', branch: 'main', x: 300, y: 100, parents: ['c2'], isOrphan: true, isDanger: true }
            ],
            branches: [
              { name: 'main', target: 'c2', color: PALETTE.main }
            ],
            head: { type: 'branch', target: 'main' }
          }
        }
      ]
    }
  ];

  /* =========================================================
     State Management
     ========================================================= */
  var currentScenarioIndex = 0;
  var currentStepIndex = 0;
  var isAutoPlaying = false;
  var autoPlayTimer = null;

  /* Playground custom interactive state */
  var isPlaygroundMode = false;
  var playgroundGraph = null;
  var commitCounter = 1;

  /* =========================================================
     DOM Helpers & Selectors
     ========================================================= */
  function $(id) { return document.getElementById(id); }

  function escapeHTML(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  /* =========================================================
     SVG Rendering Engine
     ========================================================= */
  function renderSVG(graphData) {
    var svg = $('visualizerSvg');
    if (!svg || !graphData || !graphData.nodes) return;

    var nodes = graphData.nodes;
    var branches = graphData.branches || [];
    var head = graphData.head || { type: 'branch', target: 'main' };

    // Calculate bounding box width dynamically to perfectly fit viewBox
    var minX = 9999, maxX = -9999;
    nodes.forEach(function (n) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
    });

    var paddingX = 75;
    var viewBoxX = Math.max(0, minX - paddingX);
    var viewBoxWidth = Math.max((maxX - minX) + (paddingX * 2), 580);
    svg.setAttribute('viewBox', viewBoxX + ' 15 ' + viewBoxWidth + ' 250');

    var nodeMap = {};
    nodes.forEach(function (n) { nodeMap[n.id] = n; });

    var html = '';

    // 1. Draw connecting lines / curves between parent and child nodes
    nodes.forEach(function (child) {
      if (!child.parents || !child.parents.length) return;
      child.parents.forEach(function (parentId) {
        var parent = nodeMap[parentId];
        if (!parent) return;

        var x1 = parent.x;
        var y1 = parent.y;
        var x2 = child.x;
        var y2 = child.y;

        var isDashed = child.isOrphan || parent.isOrphan;
        var strokeColor = isDashed ? '#484f58' : (child.isNew ? '#58a6ff' : '#30363d');
        var strokeWidth = isDashed ? '2.2' : '2.8';

        if (y1 === y2) {
          // Straight horizontal line
          html += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" ' +
            'stroke="' + strokeColor + '" stroke-width="' + strokeWidth + '" ' +
            (isDashed ? 'stroke-dasharray="5 5" ' : '') + 'class="viz-edge" />';
        } else {
          // Smooth Bezier Curve for branching / merging
          var cx1 = x1 + (x2 - x1) * 0.5;
          var cy1 = y1;
          var cx2 = x1 + (x2 - x1) * 0.5;
          var cy2 = y2;
          var d = 'M ' + x1 + ' ' + y1 + ' C ' + cx1 + ' ' + cy1 + ', ' + cx2 + ' ' + cy2 + ', ' + x2 + ' ' + y2;
          html += '<path d="' + d + '" fill="none" stroke="' + strokeColor + '" stroke-width="' + strokeWidth + '" ' +
            (isDashed ? 'stroke-dasharray="5 5" ' : '') + 'class="viz-edge" />';
        }
      });
    });

    // 2. Draw Commit Nodes
    nodes.forEach(function (node) {
      var isHead = (head.type === 'commit' && head.target === node.id);
      var color = PALETTE.main;
      if (node.isDanger) color = PALETTE.danger;
      else if (node.isOrphan) color = PALETTE.orphan;
      else if (node.isCherry) color = PALETTE.cherry;
      else if (node.isRebased) color = PALETTE.release;
      else if (node.branch && node.branch.indexOf('feat') === 0) color = PALETTE.feature;
      else if (node.branch && node.branch.indexOf('hotfix') === 0) color = PALETTE.hotfix;

      var nodeClass = 'viz-node' + (node.isNew ? ' viz-pop' : '') + (node.isOrphan ? ' viz-dim' : '');

      // Glowing outer ring for new or selected nodes
      if (node.isNew || isHead) {
        html += '<circle cx="' + node.x + '" cy="' + node.y + '" r="19" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-opacity="0.5" class="viz-glow" />';
      }

      // Circle node
      html += '<g class="' + nodeClass + '" data-node-id="' + node.id + '" tabindex="0" role="button" aria-label="Commit ' + (node.sha || node.id) + ': ' + escapeHTML(node.msg) + '">';
      html += '<circle cx="' + node.x + '" cy="' + node.y + '" r="13" fill="' + (node.isOrphan ? '#161b22' : color) + '" stroke="' + color + '" stroke-width="2.8" />';

      // SHA Label underneath
      html += '<text x="' + node.x + '" y="' + (node.y + 28) + '" text-anchor="middle" class="viz-node-sha">' + (node.sha ? node.sha.substring(0, 6) : node.id) + '</text>';
      html += '</g>';
    });

    // 3. Draw Branch Labels & HEAD marker
    // Group branch labels by target commit to stack them cleanly if multiple branches point to same commit
    var branchesByTarget = {};
    branches.forEach(function (b) {
      (branchesByTarget[b.target] = branchesByTarget[b.target] || []).push(b);
    });

    Object.keys(branchesByTarget).forEach(function (targetId) {
      var targetNode = nodeMap[targetId];
      if (!targetNode) return;

      var bList = branchesByTarget[targetId];
      bList.forEach(function (b, idx) {
        var isHeadBranch = (head.type === 'branch' && head.target === b.name);
        var labelY = targetNode.y - 32 - (idx * 28);
        var labelText = b.name;
        var badgeColor = b.color || PALETTE.main;

        var charWidth = 7.5;
        var boxWidth = Math.max(labelText.length * charWidth + 20, 58);
        if (isHeadBranch) boxWidth += 58; // extra space for HEAD -> badge

        var boxX = targetNode.x - (boxWidth / 2);

        html += '<g class="viz-branch-group viz-pop" style="--delay: 0.1s">';
        // Pointer arrow downwards to the node
        if (idx === 0) {
          html += '<line x1="' + targetNode.x + '" y1="' + (labelY + 13) + '" x2="' + targetNode.x + '" y2="' + (targetNode.y - 15) + '" stroke="' + badgeColor + '" stroke-width="2" stroke-linecap="round" />';
        }

        // Branch Badge background
        html += '<rect x="' + boxX + '" y="' + labelY + '" width="' + boxWidth + '" height="24" rx="12" fill="#0d1117" stroke="' + badgeColor + '" stroke-width="1.8" />';

        if (isHeadBranch) {
          // HEAD prefix badge
          html += '<rect x="' + (boxX + 2) + '" y="' + (labelY + 2) + '" width="48" height="20" rx="10" fill="' + badgeColor + '" />';
          html += '<text x="' + (boxX + 26) + '" y="' + (labelY + 15.5) + '" text-anchor="middle" class="viz-head-text">HEAD</text>';
          html += '<text x="' + (boxX + 57) + '" y="' + (labelY + 15.5) + '" class="viz-branch-text" fill="' + badgeColor + '">' + escapeHTML(labelText) + '</text>';
        } else {
          html += '<text x="' + targetNode.x + '" y="' + (labelY + 15.5) + '" text-anchor="middle" class="viz-branch-text" fill="' + badgeColor + '">' + escapeHTML(labelText) + '</text>';
        }

        html += '</g>';
      });
    });

    // 4. Detached HEAD Label if HEAD points directly to a commit
    if (head.type === 'commit') {
      var headNode = nodeMap[head.target];
      if (headNode) {
        var dLabelY = headNode.y - 32;
        html += '<g class="viz-branch-group viz-pop">';
        html += '<line x1="' + headNode.x + '" y1="' + (dLabelY + 13) + '" x2="' + headNode.x + '" y2="' + (headNode.y - 15) + '" stroke="' + PALETTE.danger + '" stroke-width="2" stroke-linecap="round" />';
        html += '<rect x="' + (headNode.x - 68) + '" y="' + dLabelY + '" width="136" height="24" rx="12" fill="#0d1117" stroke="' + PALETTE.danger + '" stroke-width="1.8" />';
        html += '<rect x="' + (headNode.x - 66) + '" y="' + (dLabelY + 2) + '" width="48" height="20" rx="10" fill="' + PALETTE.danger + '" />';
        html += '<text x="' + (headNode.x - 42) + '" y="' + (dLabelY + 15.5) + '" text-anchor="middle" class="viz-head-text" fill="#fff">HEAD</text>';
        html += '<text x="' + (headNode.x + 19) + '" y="' + (dLabelY + 15.5) + '" text-anchor="middle" class="viz-branch-text" fill="' + PALETTE.danger + '">(detached)</text>';
        html += '</g>';
      }
    }

    svg.innerHTML = html;

    // Attach click inspection handlers to nodes
    var nodeEls = svg.querySelectorAll('.viz-node');
    nodeEls.forEach(function (el) {
      el.addEventListener('click', function () {
        var nId = el.getAttribute('data-node-id');
        var nData = nodeMap[nId];
        if (nData) showNodeInspector(nData);
      });
    });
  }

  function showNodeInspector(node) {
    var insp = $('vizInspector');
    if (!insp) return;

    insp.innerHTML =
      '<div class="viz-insp-inner">' +
        '<div class="viz-insp-head">' +
          '<span class="viz-insp-sha">Commit <code>' + (node.sha || node.id) + '</code></span>' +
          '<span class="viz-insp-branch" style="color: ' + (node.branch === 'main' ? PALETTE.main : PALETTE.feature) + '">' + escapeHTML(node.branch || 'detached') + '</span>' +
        '</div>' +
        '<p class="viz-insp-msg">"' + escapeHTML(node.msg || 'No message') + '"</p>' +
        '<div class="viz-insp-meta">' +
          '<span>Parents: <code>' + (node.parents && node.parents.length ? node.parents.join(', ') : 'Root / None') + '</code></span>' +
        '</div>' +
      '</div>';
    insp.hidden = false;
  }

  /* =========================================================
     Scenario Playback Controller
     ========================================================= */
  function loadScenario(index, stepIdx) {
    if (index < 0 || index >= SCENARIOS.length) return;
    currentScenarioIndex = index;
    currentStepIndex = typeof stepIdx === 'number' ? stepIdx : 0;
    isPlaygroundMode = false;

    var sc = SCENARIOS[currentScenarioIndex];
    var step = sc.steps[currentStepIndex];

    // Update Scenario Pills
    var pills = document.querySelectorAll('.viz-scenario-pill');
    pills.forEach(function (p, i) {
      p.classList.toggle('active', i === currentScenarioIndex);
    });

    // Update Step Counters & Titles
    if ($('vizScenarioTitle')) $('vizScenarioTitle').textContent = sc.title;
    if ($('vizScenarioSub')) $('vizScenarioSub').textContent = sc.subtitle;
    if ($('vizStepTitle')) $('vizStepTitle').textContent = step.title;
    if ($('vizStepNum')) $('vizStepNum').textContent = 'Step ' + (currentStepIndex + 1) + ' of ' + sc.steps.length;
    if ($('vizStepWhy')) $('vizStepWhy').textContent = step.why;
    if ($('vizStepTip')) $('vizStepTip').textContent = step.tip;

    // Update Command Box
    if ($('vizCmdCode')) $('vizCmdCode').textContent = step.cmd;

    // Stepper button disabled states
    if ($('vizPrevBtn')) $('vizPrevBtn').disabled = currentStepIndex === 0;
    if ($('vizNextBtn')) $('vizNextBtn').disabled = currentStepIndex === sc.steps.length - 1;

    // Stepper dots
    renderStepperDots(sc.steps.length, currentStepIndex);

    // Hide inspector on step change
    if ($('vizInspector')) $('vizInspector').hidden = true;

    // Render Graph
    renderSVG(step.graph);
  }

  function renderStepperDots(total, current) {
    var wrap = $('vizStepperDots');
    if (!wrap) return;
    var html = '';
    for (var i = 0; i < total; i++) {
      html += '<button type="button" class="viz-dot' + (i === current ? ' active' : '') + '" data-step-jump="' + i + '" aria-label="Jump to step ' + (i + 1) + '"></button>';
    }
    wrap.innerHTML = html;
  }

  function nextStep() {
    var sc = SCENARIOS[currentScenarioIndex];
    if (currentStepIndex < sc.steps.length - 1) {
      loadScenario(currentScenarioIndex, currentStepIndex + 1);
    } else if (isAutoPlaying) {
      pauseAutoPlay();
    }
  }

  function prevStep() {
    if (currentStepIndex > 0) {
      loadScenario(currentScenarioIndex, currentStepIndex - 1);
    }
  }

  function toggleAutoPlay() {
    if (isAutoPlaying) {
      pauseAutoPlay();
    } else {
      startAutoPlay();
    }
  }

  function startAutoPlay() {
    isAutoPlaying = true;
    var btn = $('vizPlayBtn');
    if (btn) {
      btn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor"/><rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor"/></svg><span>Pause</span>';
      btn.classList.add('playing');
    }

    // If at end, start from beginning
    var sc = SCENARIOS[currentScenarioIndex];
    if (currentStepIndex >= sc.steps.length - 1) {
      loadScenario(currentScenarioIndex, 0);
    }

    autoPlayTimer = setInterval(function () {
      var currentSc = SCENARIOS[currentScenarioIndex];
      if (currentStepIndex < currentSc.steps.length - 1) {
        nextStep();
      } else {
        pauseAutoPlay();
      }
    }, 2800);
  }

  function pauseAutoPlay() {
    isAutoPlaying = false;
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
    var btn = $('vizPlayBtn');
    if (btn) {
      btn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg><span>Auto Play</span>';
      btn.classList.remove('playing');
    }
  }

  /* =========================================================
     Interactive Sandbox / Custom Playground Engine
     ========================================================= */
  function initPlayground() {
    isPlaygroundMode = true;
    pauseAutoPlay();
    commitCounter = 3;

    playgroundGraph = {
      nodes: [
        { id: 'c1', sha: '1a2b3c', msg: 'Initial repo scaffold', branch: 'main', x: 60, y: 100 },
        { id: 'c2', sha: '2b3c4d', msg: 'Add app router & layout', branch: 'main', x: 170, y: 100, parents: ['c1'] }
      ],
      branches: [
        { name: 'main', target: 'c2', color: PALETTE.main }
      ],
      head: { type: 'branch', target: 'main' }
    };

    if ($('vizScenarioTitle')) $('vizScenarioTitle').textContent = 'Interactive Playground (Live Sandbox)';
    if ($('vizScenarioSub')) $('vizScenarioSub').textContent = 'Freely run commits, branches, merges, and rebases to watch the graph update in real time.';
    if ($('vizStepTitle')) $('vizStepTitle').textContent = 'Playground Ready: Branch "main" at C2';
    if ($('vizStepNum')) $('vizStepNum').textContent = 'Custom Graph Sandbox';
    if ($('vizStepWhy')) $('vizStepWhy').textContent = 'Click the action buttons below (Commit, Branch, Merge, Rebase, Reset) to simulate real Git commands on this live graph.';
    if ($('vizStepTip')) $('vizStepTip').textContent = 'Everything stays in your browser memory. Click "Reset Sandbox" anytime to start fresh.';
    if ($('vizCmdCode')) $('vizCmdCode').textContent = '# Ready for your commands';

    if ($('vizPrevBtn')) $('vizPrevBtn').disabled = true;
    if ($('vizNextBtn')) $('vizNextBtn').disabled = true;
    if ($('vizStepperDots')) $('vizStepperDots').innerHTML = '';

    renderSVG(playgroundGraph);
  }

  function sandboxCommit(customMsg) {
    if (!isPlaygroundMode) initPlayground();
    commitCounter++;

    var head = playgroundGraph.head;
    var activeBranch = playgroundGraph.branches.find(function (b) { return b.name === head.target; });
    var parentId = activeBranch ? activeBranch.target : head.target;
    var parentNode = playgroundGraph.nodes.find(function (n) { return n.id === parentId; });

    var nextX = parentNode ? parentNode.x + 110 : 200;
    var nextY = parentNode ? parentNode.y : 100;

    var newId = 'c' + commitCounter;
    var newSha = Math.random().toString(16).substring(2, 8);
    var branchName = activeBranch ? activeBranch.name : 'detached';

    var newNode = {
      id: newId,
      sha: newSha,
      msg: customMsg || ('Commit ' + commitCounter + ' on ' + branchName),
      branch: branchName,
      x: nextX,
      y: nextY,
      parents: parentNode ? [parentNode.id] : [],
      isNew: true
    };

    playgroundGraph.nodes.push(newNode);

    if (activeBranch) {
      activeBranch.target = newId;
    } else {
      playgroundGraph.head.target = newId;
    }

    if ($('vizCmdCode')) $('vizCmdCode').textContent = 'git commit -m "' + newNode.msg + '"';
    if ($('vizStepTitle')) $('vizStepTitle').textContent = 'Created Commit ' + newSha + ' on ' + branchName;
    if ($('vizStepWhy')) $('vizStepWhy').textContent = 'New commit ' + newSha + ' appended to active branch ' + branchName + '. Head advanced.';

    renderSVG(playgroundGraph);
  }

  function sandboxCreateBranch(name) {
    if (!isPlaygroundMode) initPlayground();
    var bName = name || prompt('Enter new branch name (e.g. feat/dashboard):', 'feat/feature-' + commitCounter);
    if (!bName) return;

    bName = bName.trim().replace(/\s+/g, '-');
    var existing = playgroundGraph.branches.find(function (b) { return b.name === bName; });
    if (existing) {
      alert('Branch "' + bName + '" already exists!');
      return;
    }

    var head = playgroundGraph.head;
    var currentTarget = head.type === 'branch' ?
      (playgroundGraph.branches.find(function (b) { return b.name === head.target; }) || {}).target :
      head.target;

    var color = bName.indexOf('feat') === 0 ? PALETTE.feature : (bName.indexOf('hotfix') === 0 ? PALETTE.hotfix : PALETTE.cherry);

    playgroundGraph.branches.push({
      name: bName,
      target: currentTarget,
      color: color
    });

    // Switch to new branch
    playgroundGraph.head = { type: 'branch', target: bName };

    if ($('vizCmdCode')) $('vizCmdCode').textContent = 'git checkout -b ' + bName;
    if ($('vizStepTitle')) $('vizStepTitle').textContent = 'Switched to a new branch "' + bName + '"';
    if ($('vizStepWhy')) $('vizStepWhy').textContent = 'Created branch pointer "' + bName + '" at commit ' + currentTarget + ' and switched HEAD to it.';

    renderSVG(playgroundGraph);
  }

  function sandboxSwitchBranch() {
    if (!isPlaygroundMode) initPlayground();
    if (playgroundGraph.branches.length <= 1) {
      alert('You only have one branch. Create a new branch first using "+ New Branch"!');
      return;
    }

    var names = playgroundGraph.branches.map(function (b) { return b.name; });
    var target = prompt('Choose branch to switch to:\n' + names.join(', '), names.find(function (n) { return n !== playgroundGraph.head.target; }));
    if (!target || names.indexOf(target) === -1) return;

    playgroundGraph.head = { type: 'branch', target: target };

    if ($('vizCmdCode')) $('vizCmdCode').textContent = 'git checkout ' + target;
    if ($('vizStepTitle')) $('vizStepTitle').textContent = 'Switched to branch "' + target + '"';
    if ($('vizStepWhy')) $('vizStepWhy').textContent = 'HEAD now points to branch ref "' + target + '".';

    renderSVG(playgroundGraph);
  }

  function sandboxReset() {
    if (!isPlaygroundMode) initPlayground();
    var head = playgroundGraph.head;
    var activeBranch = playgroundGraph.branches.find(function (b) { return b.name === head.target; });
    if (!activeBranch) return;

    var currentCommit = playgroundGraph.nodes.find(function (n) { return n.id === activeBranch.target; });
    if (!currentCommit || !currentCommit.parents || !currentCommit.parents.length) {
      alert('Cannot reset past initial commit!');
      return;
    }

    var parentId = currentCommit.parents[0];
    activeBranch.target = parentId;

    if ($('vizCmdCode')) $('vizCmdCode').textContent = 'git reset --soft HEAD~1';
    if ($('vizStepTitle')) $('vizStepTitle').textContent = 'Reset HEAD~1 on ' + activeBranch.name;
    if ($('vizStepWhy')) $('vizStepWhy').textContent = 'Moved ' + activeBranch.name + ' pointer back to ' + parentId + '. Previous commit is now undone.';

    renderSVG(playgroundGraph);
  }

  /* =========================================================
     Init & Event Listeners
     ========================================================= */
  function init() {
    var container = $('visualizer');
    if (!container) return;

    // Render Scenario Pills
    var pillsWrap = $('vizScenarioPills');
    if (pillsWrap) {
      var html = '';
      SCENARIOS.forEach(function (sc, idx) {
        html += '<button type="button" class="viz-scenario-pill' + (idx === 0 ? ' active' : '') + '" data-viz-scenario="' + idx + '">' +
          '<span>' + escapeHTML(sc.title.split(' ')[0]) + '</span> ' +
          '<i>' + escapeHTML(sc.title.substring(sc.title.indexOf(' '))) + '</i>' +
        '</button>';
      });
      html += '<button type="button" class="viz-scenario-pill viz-sandbox-pill" id="vizSandboxBtn"><span>🎮 Sandbox</span> <i>(Free Mode)</i></button>';
      pillsWrap.innerHTML = html;
    }

    // Bind Scenario click
    if (pillsWrap) {
      pillsWrap.addEventListener('click', function (ev) {
        var pill = ev.target.closest('[data-viz-scenario]');
        if (pill) {
          var idx = parseInt(pill.getAttribute('data-viz-scenario'), 10);
          loadScenario(idx, 0);
          return;
        }
        var sandboxBtn = ev.target.closest('#vizSandboxBtn');
        if (sandboxBtn) {
          document.querySelectorAll('.viz-scenario-pill').forEach(function (p) { p.classList.remove('active'); });
          sandboxBtn.classList.add('active');
          initPlayground();
        }
      });
    }

    // Stepper Controls
    var nextBtn = $('vizNextBtn');
    if (nextBtn) nextBtn.addEventListener('click', nextStep);

    var prevBtn = $('vizPrevBtn');
    if (prevBtn) prevBtn.addEventListener('click', prevStep);

    var playBtn = $('vizPlayBtn');
    if (playBtn) playBtn.addEventListener('click', toggleAutoPlay);

    var resetBtn = $('vizResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      if (isPlaygroundMode) initPlayground();
      else loadScenario(currentScenarioIndex, 0);
    });

    // Stepper Dots delegate
    var dotsWrap = $('vizStepperDots');
    if (dotsWrap) {
      dotsWrap.addEventListener('click', function (ev) {
        var dot = ev.target.closest('[data-step-jump]');
        if (dot) {
          var sIdx = parseInt(dot.getAttribute('data-step-jump'), 10);
          loadScenario(currentScenarioIndex, sIdx);
        }
      });
    }

    // Copy Command button
    var copyBtn = $('vizCopyCmdBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var codeEl = $('vizCmdCode');
        if (!codeEl) return;
        var text = codeEl.textContent.trim();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            copyBtn.classList.add('done');
            setTimeout(function () { copyBtn.classList.remove('done'); }, 1500);
            if (window.GitAtlasToolkit && typeof window.GitAtlasToolkit.recordCopy === 'function') {
              window.GitAtlasToolkit.recordCopy(text, 'Git Graph Visualizer');
            }
          });
        }
      });
    }

    // Sandbox Toolbar Action Buttons
    if ($('sbCommitBtn')) $('sbCommitBtn').addEventListener('click', function () { sandboxCommit(); });
    if ($('sbBranchBtn')) $('sbBranchBtn').addEventListener('click', function () { sandboxCreateBranch(); });
    if ($('sbSwitchBtn')) $('sbSwitchBtn').addEventListener('click', function () { sandboxSwitchBranch(); });
    if ($('sbResetBtn')) $('sbResetBtn').addEventListener('click', function () { sandboxReset(); });
    if ($('sbClearBtn')) $('sbClearBtn').addEventListener('click', function () { initPlayground(); });

    // Load initial scenario
    loadScenario(0, 0);
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export API for external controls
  window.GitAtlasVisualizer = {
    loadScenario: loadScenario,
    initPlayground: initPlayground,
    sandboxCommit: sandboxCommit,
    sandboxCreateBranch: sandboxCreateBranch
  };

})();
