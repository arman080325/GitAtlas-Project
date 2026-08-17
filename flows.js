/* GitAtlas — flows.js
   Guided playbooks and the wizard that routes people to them.

   A playbook is an ordered sequence with the safety work built in:
   every risky step carries a check you run first, so you look before
   you leap. Steps use:
     do    what this step achieves, in plain English
     cmd   the command to run (may be multi-line)
     check a read-only command to run first, and why it matters
     warn  what this step cannot be undone from */

const PLAYBOOKS = [

/* ---------------- everyday workflows ---------------- */

{
  id: "feature-pr",
  kind: "workflow",
  title: "Start a feature and open a pull request",
  goal: "Take an idea from a clean main branch to a reviewable pull request.",
  when: "The default loop for almost any change on a team.",
  steps: [
    { do: "Start from a main branch that matches the server, so you are not building on stale code.",
      cmd: "git switch main\ngit pull",
      check: { cmd: "git status", why: "Confirms you have no uncommitted work that the pull would collide with." } },
    { do: "Create the branch. The name is the first thing a reviewer reads, so make it describe the change.",
      cmd: "git switch -c feat/user-profile" },
    { do: "Work in small commits. Stage deliberately rather than sweeping everything up.",
      cmd: "git add -p\ngit commit -m \"feat(profile): add avatar upload\"",
      check: { cmd: "git diff", why: "Shows exactly what you are about to stage — this is where stray debug lines get caught." } },
    { do: "Publish the branch and set its upstream, so later pushes need no arguments.",
      cmd: "git push -u origin feat/user-profile" },
    { do: "Open the pull request. Filling it from your commits takes seconds when the messages are good.",
      cmd: "gh pr create --fill" },
    { do: "Address review feedback with fixup commits, then fold them in so the history stays clean.",
      cmd: "git commit --fixup <commit-hash>\ngit rebase -i --autosquash main\ngit push --force-with-lease",
      warn: "Rewrites your branch history. Safe on your own branch; coordinate first if someone else is working on it." },
    { do: "Merge and clean up in one command once it is approved.",
      cmd: "gh pr merge --squash --delete-branch" }
  ],
  after: "Switch back to main and pull, so your next branch starts from the merged code.",
  related: ["branch", "sync", "ghcli"]
},
{
  id: "update-fork",
  kind: "workflow",
  title: "Update a fork from the original project",
  goal: "Pull the upstream project's latest commits into your fork before you start contributing.",
  when: "Any open-source contribution. A fork goes stale within days.",
  steps: [
    { do: "Check whether the original project is registered as a remote yet.",
      cmd: "git remote -v",
      check: { cmd: "git remote -v", why: "If you only see origin, the upstream link does not exist yet." } },
    { do: "Add the original repository as upstream. Do this once per clone.",
      cmd: "git remote add upstream https://github.com/original/repo.git" },
    { do: "Fetch upstream's commits without touching your files.",
      cmd: "git fetch upstream" },
    { do: "Move your main branch onto upstream's latest.",
      cmd: "git switch main\ngit merge upstream/main",
      check: { cmd: "git log --oneline HEAD..upstream/main", why: "Lists exactly which commits are about to arrive." } },
    { do: "Push the refreshed main to your own fork so GitHub stops showing it as behind.",
      cmd: "git push origin main" },
    { do: "Branch your contribution from upstream directly, so it starts from current code no matter what.",
      cmd: "git switch -c fix/typo-in-readme upstream/main" }
  ],
  after: "Push the branch to your fork, then open the pull request against the original repository.",
  related: ["fork", "remotes"]
},
{
  id: "resolve-conflict",
  kind: "workflow",
  title: "Resolve a merge conflict",
  goal: "Work through a conflict calmly, without losing either side's changes.",
  when: "Git stops mid-merge, mid-rebase or mid-cherry-pick and asks you to choose.",
  steps: [
    { do: "Find out exactly which files are conflicted. Usually far fewer than it feels like.",
      cmd: "git diff --name-only --diff-filter=U",
      check: { cmd: "git status", why: "Tells you which operation you are in, and therefore which continue command to use later." } },
    { do: "Understand why the conflict exists before editing anything — the commits from both sides explain it.",
      cmd: "git log --merge -p path/to/file.js" },
    { do: "Open each file and choose the final content. Delete the marker lines completely.",
      cmd: "# <<<<<<< HEAD\n#   your side\n# =======\n#   their side\n# >>>>>>> feature-branch" },
    { do: "For generated files such as lock files, take one side wholesale and regenerate rather than merging by hand.",
      cmd: "git checkout --ours package-lock.json\nnpm install" },
    { do: "Stage each file as you finish it. The list from step one is your checklist.",
      cmd: "git add path/to/file.js" },
    { do: "Continue the operation you were in.",
      cmd: "git merge --continue    # or: git rebase --continue" }
  ],
  after: "Run the test suite before pushing. A conflict resolved cleanly can still be logically wrong.",
  related: ["merge", "rebase"]
},
{
  id: "move-work",
  kind: "workflow",
  title: "Move unfinished work to another branch",
  goal: "Carry uncommitted changes onto the branch they should have been on.",
  when: "You started editing before realising you were on main, or on the wrong feature branch.",
  steps: [
    { do: "See what you actually have in progress.",
      cmd: "git status" },
    { do: "Put the work aside, including any new untracked files.",
      cmd: "git stash push -u -m \"profile page work in progress\"",
      check: { cmd: "git stash list", why: "Confirms the stash was created before you switch away." } },
    { do: "Move to the branch it belongs on, creating it if needed.",
      cmd: "git switch -c feat/profile-page    # or: git switch existing-branch" },
    { do: "Bring the work back.",
      cmd: "git stash pop" },
    { do: "If the stash refuses to apply because the branch moved on, restore it onto its original base instead.",
      cmd: "git stash branch rescue/profile-work stash@{0}" }
  ],
  after: "Commit promptly. A stash is a drawer, not a filing cabinet — they are easy to forget.",
  related: ["stash", "branch"]
},
{
  id: "release-tag",
  kind: "workflow",
  title: "Cut and publish a release",
  goal: "Turn the current state of main into a tagged, published version.",
  when: "Shipping any versioned release.",
  steps: [
    { do: "Release from an up-to-date main and confirm the tree is clean.",
      cmd: "git switch main\ngit pull",
      check: { cmd: "git status", why: "Never tag a commit that includes uncommitted local changes." } },
    { do: "Find the previous tag so you can see what is going into this release.",
      cmd: "git describe --tags --abbrev=0" },
    { do: "Read the changes since that tag. This is your changelog.",
      cmd: "git log $(git describe --tags --abbrev=0)..HEAD --oneline --no-merges" },
    { do: "Create an annotated tag. Annotated, not lightweight — GitHub uses the message as the release body.",
      cmd: "git tag -a v1.2.0 -m \"Release 1.2.0\"" },
    { do: "Push the commit and the tag together.",
      cmd: "git push --follow-tags" },
    { do: "Publish the GitHub release with notes generated from the merged pull requests.",
      cmd: "gh release create v1.2.0 --generate-notes" }
  ],
  after: "If a tag pushed early or wrong, delete it locally and remotely fast — before anyone fetches it.",
  related: ["tags", "ghcli"]
},
{
  id: "tidy-history",
  kind: "workflow",
  title: "Tidy a messy branch before review",
  goal: "Turn a pile of work-in-progress commits into a few meaningful ones.",
  when: "Before opening a pull request, when your branch reads wip, wip2, fix typo.",
  steps: [
    { do: "See what you are about to rewrite, and count the commits.",
      cmd: "git log --oneline main..HEAD",
      check: { cmd: "git log --oneline main..HEAD", why: "The number of commits here is the number you pass to the rebase." } },
    { do: "Make a backup branch. It costs nothing and makes the rest of this reversible.",
      cmd: "git branch backup/pre-cleanup" },
    { do: "Start an interactive rebase over just your own commits.",
      cmd: "git rebase -i main",
      warn: "Rewrites history. Only do this on a branch nobody else has based work on." },
    { do: "In the editor, mark commits to combine or rename, then save and close.",
      cmd: "pick   a1b2c3  feat: add login form\nsquash d4e5f6  wip\nsquash 7g8h9i  fix typo\nreword j1k2l3  add validation\ndrop   m4n5o6  debug logging" },
    { do: "Push the rewritten branch safely.",
      cmd: "git push --force-with-lease" },
    { do: "Once the pull request is merged, delete the backup branch.",
      cmd: "git branch -D backup/pre-cleanup" }
  ],
  after: "If the rebase goes wrong at any point, git rebase --abort puts everything back.",
  related: ["rebase", "commit"]
},

/* ---------------- recovery ---------------- */

{
  id: "lost-commit",
  kind: "rescue",
  title: "Recover a lost commit or deleted branch",
  goal: "Find work that vanished after a reset, a rebase, or a deleted branch.",
  when: "Commits you made are no longer reachable from any branch.",
  steps: [
    { do: "Open the reflog. It records every position HEAD has held, including ones no branch points at any more.",
      cmd: "git reflog",
      check: { cmd: "git reflog", why: "Read-only. Nothing here changes your repository." } },
    { do: "Find the entry from just before things went wrong. The message column tells you what each step was.",
      cmd: "# a1b2c3 HEAD@{0}: reset: moving to HEAD~3\n# d4e5f6 HEAD@{1}: commit: the work you are looking for" },
    { do: "Confirm it is the right commit before moving anything.",
      cmd: "git show d4e5f6 --stat" },
    { do: "Recover it onto a new branch. This is safer than resetting, because it changes nothing that currently exists.",
      cmd: "git switch -c rescue/lost-work d4e5f6" },
    { do: "If a whole branch was deleted, search the reflog for its name instead.",
      cmd: "git reflog | grep feat/deleted-branch" },
    { do: "If the reflog has already been pruned, look for dangling commits directly in the object database.",
      cmd: "git fsck --lost-found --no-reflogs" }
  ],
  after: "Reflog entries expire after about 90 days, and git gc --prune=now clears them immediately. Recover first, tidy later.",
  related: ["undo", "branch"]
},
{
  id: "hard-reset-oops",
  kind: "rescue",
  title: "Undo a reset --hard",
  goal: "Get back the commits a hard reset threw away.",
  when: "You ran git reset --hard and the commits disappeared.",
  steps: [
    { do: "Stop and change nothing else. New commits can make recovery harder.",
      cmd: "git status" },
    { do: "Find where HEAD was immediately before the reset.",
      cmd: "git reflog",
      check: { cmd: "git reflog", why: "Read-only, and it still holds the commit the reset moved away from." } },
    { do: "Preview that position to be sure it is the state you want back.",
      cmd: "git show HEAD@{1} --stat" },
    { do: "Branch from it rather than resetting again — you keep both states this way.",
      cmd: "git switch -c rescue/before-reset HEAD@{1}" },
    { do: "If you are certain, move the original branch back instead.",
      cmd: "git switch main\ngit reset --hard HEAD@{1}",
      warn: "Another hard reset. Only run this once you have confirmed the target with git show." }
  ],
  after: "Committed work is recoverable this way. Uncommitted edits that a hard reset discarded are not — which is the argument for committing early and often.",
  related: ["undo"]
},
{
  id: "lost-uncommitted",
  kind: "rescue",
  title: "Uncommitted changes disappeared",
  goal: "Establish honestly whether the work is recoverable, and try the routes that exist.",
  when: "A checkout, restore, clean or hard reset wiped edits you had never committed.",
  steps: [
    { do: "Check whether the work was ever staged. If git add ran at any point, the content is in the object database.",
      cmd: "git fsck --lost-found",
      check: { cmd: "git fsck --lost-found", why: "Read-only. Lists dangling blobs, which are staged-but-never-committed file contents." } },
    { do: "Inspect any dangling blob it reports to see whether it is your file.",
      cmd: "git show <blob-hash>" },
    { do: "Check the stash — it is easy to stash something and forget.",
      cmd: "git stash list" },
    { do: "Check your editor's local history, which is independent of Git. In VS Code: Timeline view in the Explorer sidebar, or the Local History extension.",
      cmd: "# VS Code: right-click the file -> Open Timeline\n# JetBrains: right-click -> Local History -> Show History" }
  ],
  after: "If none of those find it, the work is genuinely gone — Git never saw it. Commit work-in-progress early; you can always tidy the history later.",
  related: ["undo", "stash"]
},
{
  id: "wrong-branch",
  kind: "rescue",
  title: "Committed to the wrong branch",
  goal: "Move commits onto the branch they belong on and clean up the one they landed on.",
  when: "You committed to main, or to another feature branch, by mistake.",
  steps: [
    { do: "Confirm which commits are misplaced and how many there are.",
      cmd: "git log --oneline -5",
      check: { cmd: "git log --oneline origin/main..HEAD", why: "Shows commits that exist locally but not on the server — these are the ones you can safely move." } },
    { do: "Bookmark the commits with a new branch. The work is now safe regardless of what happens next.",
      cmd: "git branch feat/right-place" },
    { do: "Rewind the branch they should not be on. Adjust the number to match the commit count.",
      cmd: "git reset --hard HEAD~2",
      warn: "Discards uncommitted changes too. Run git status first and stash anything in progress.",
      check: { cmd: "git status", why: "Confirms there is no uncommitted work about to be destroyed." } },
    { do: "Switch to the branch that now holds the work.",
      cmd: "git switch feat/right-place" },
    { do: "If the commits were already pushed to a shared branch, do not rewrite it — revert them instead.",
      cmd: "git revert <oldest-hash>^..<newest-hash>" }
  ],
  after: "Reverting is the safe choice on any branch other people pull from. Resetting is fine on your own.",
  related: ["undo", "branch"]
},
{
  id: "wrong-message",
  kind: "rescue",
  title: "Fix a bad commit message",
  goal: "Correct a commit message, whether it is the last one or further back.",
  when: "You wrote fix stuff, or referenced the wrong ticket number.",
  steps: [
    { do: "Check whether the commit has been pushed. This decides everything that follows.",
      cmd: "git log --oneline origin/main..HEAD",
      check: { cmd: "git status", why: "Tells you whether your branch is ahead of the remote, and by how many commits." } },
    { do: "If it is the most recent commit and unpushed, amend it.",
      cmd: "git commit --amend -m \"fix(auth): reject expired session tokens\"" },
    { do: "For an older commit, use an interactive rebase and mark it reword.",
      cmd: "git rebase -i HEAD~4",
      warn: "Rewrites history from that commit forward." },
    { do: "If the branch was already pushed, publish the correction safely.",
      cmd: "git push --force-with-lease" }
  ],
  after: "Never force-push a shared branch to fix a message. On main, a wrong message is not worth breaking everyone's clone.",
  related: ["commit", "rebase"]
},
{
  id: "bad-merge",
  kind: "rescue",
  title: "Undo a merge that broke things",
  goal: "Roll back a merge safely, whether or not it has been pushed.",
  when: "A merged branch broke the build or production.",
  steps: [
    { do: "Find the merge commit and note which parent is the branch you want to keep.",
      cmd: "git log --oneline --merges -5",
      check: { cmd: "git show <merge-hash> --stat", why: "Confirms this is the merge that introduced the problem." } },
    { do: "If the merge is still in progress and conflicted, just abort — nothing is committed yet.",
      cmd: "git merge --abort" },
    { do: "If the merge is committed but not pushed, reset back to before it.",
      cmd: "git reset --hard HEAD~1",
      warn: "Destroys the merge commit and any uncommitted work.",
      check: { cmd: "git status", why: "Make sure there is nothing uncommitted you still want." } },
    { do: "If the merge is already pushed, revert it. The -m 1 means keep the branch you merged into.",
      cmd: "git revert -m 1 <merge-hash>" },
    { do: "Push the revert like a normal commit — no force needed.",
      cmd: "git push" }
  ],
  after: "To re-land the feature later, revert the revert, then fix the underlying problem on a fresh branch.",
  related: ["merge", "undo"]
},
{
  id: "conflict-abort",
  kind: "rescue",
  title: "Get out of a stuck merge, rebase or cherry-pick",
  goal: "Return to a clean state when an operation is half-finished and you want out.",
  when: "You are mid-operation, the conflicts are worse than expected, and you want to regroup.",
  steps: [
    { do: "Work out which operation you are actually in — the abort command differs.",
      cmd: "git status",
      check: { cmd: "git status", why: "The first lines name the operation and the exact command to continue or abort it." } },
    { do: "Abort it. Each of these restores the state from before the operation started.",
      cmd: "git merge --abort\ngit rebase --abort\ngit cherry-pick --abort" },
    { do: "Confirm you are back where you started.",
      cmd: "git status\ngit log --oneline -3" },
    { do: "If a rebase left you detached and confused, return to your branch explicitly.",
      cmd: "git switch feat/my-branch" }
  ],
  after: "Aborting costs nothing but the time already spent resolving. When a rebase fights back, a plain merge is often the better tool.",
  related: ["merge", "rebase"]
},
{
  id: "push-rejected",
  kind: "rescue",
  title: "Push rejected — the remote has work you do not",
  goal: "Integrate the remote commits and get your push through without destroying anyone's work.",
  when: "Git says updates were rejected, or that the remote contains work you do not have locally.",
  steps: [
    { do: "See what is actually on the remote that you are missing.",
      cmd: "git fetch origin\ngit log --oneline HEAD..origin/main",
      check: { cmd: "git fetch origin", why: "Downloads the remote state without changing any of your files." } },
    { do: "Check whether you have uncommitted work that a pull would disturb.",
      cmd: "git status" },
    { do: "Replay your commits on top of theirs, keeping history linear.",
      cmd: "git pull --rebase origin main" },
    { do: "Resolve any conflicts, then continue.",
      cmd: "git add <resolved-file>\ngit rebase --continue" },
    { do: "Push normally.",
      cmd: "git push origin main" }
  ],
  after: "Never reach for --force here. The rejection is Git protecting a teammate's commits, not an obstacle to bulldoze.",
  related: ["sync", "fixes"]
},
{
  id: "detached-head",
  kind: "rescue",
  title: "You are in detached HEAD state",
  goal: "Keep any commits you made, and get back onto a real branch.",
  when: "Git says HEAD detached at <hash>, usually after checking out a tag or commit.",
  steps: [
    { do: "Check whether you have actually made commits here, or were only looking.",
      cmd: "git log --oneline -5",
      check: { cmd: "git status", why: "Names the commit you are detached at and lists anything uncommitted." } },
    { do: "If you made commits you want to keep, create a branch at the current position first.",
      cmd: "git switch -c rescue/detached-work" },
    { do: "If you were only inspecting, switch back to your branch — nothing is lost.",
      cmd: "git switch main" },
    { do: "If you already switched away and lost the commits, the reflog still has them.",
      cmd: "git reflog" }
  ],
  after: "Detached HEAD is not an error. It only becomes a problem if you commit there and switch away without branching.",
  related: ["branch", "undo"]
},
{
  id: "pushed-secret",
  kind: "rescue",
  title: "You pushed a secret",
  goal: "Contain the exposure first, then remove it from history.",
  when: "An API key, token, password or .env file reached a remote repository.",
  steps: [
    { do: "Rotate the credential now, before touching Git at all. Assume it is compromised the moment it was public.",
      cmd: "# Revoke and reissue the key in the provider's dashboard.\n# Cleaning Git history does not un-leak a secret." },
    { do: "Stop tracking the file and make sure it cannot come back.",
      cmd: "git rm --cached .env\necho \".env\" >> .gitignore\ngit commit -m \"chore: stop tracking .env\"" },
    { do: "Find out everywhere it has ever existed in history.",
      cmd: "git log --all --full-history -- .env",
      check: { cmd: "git log --all --full-history -- .env", why: "Read-only. Shows whether the file is in old commits as well as the current one." } },
    { do: "Back up the repository before rewriting anything.",
      cmd: "git clone --mirror <your-repo-url> backup-repo.git" },
    { do: "Purge the file from every commit.",
      cmd: "pip install git-filter-repo\ngit filter-repo --path .env --invert-paths",
      warn: "Rewrites every commit hash. Everyone with a clone must re-clone afterwards." },
    { do: "Force-push the rewritten history and tags.",
      cmd: "git push --force --all\ngit push --force --tags",
      warn: "Destructive on the remote. Tell your team before you run it." }
  ],
  after: "Forks, pull requests and GitHub's cache may still hold the old objects. Rotating the credential is the only step that truly protects you.",
  related: ["security"]
},
{
  id: "big-file",
  kind: "rescue",
  title: "A huge file is making the repository slow",
  goal: "Find the oversized object and get it out of history or into LFS.",
  when: "Cloning takes forever, or GitHub rejects a push for exceeding the file size limit.",
  steps: [
    { do: "Measure the repository so you have a before number.",
      cmd: "git count-objects -vH",
      check: { cmd: "git count-objects -vH", why: "Read-only. size-pack is the number that matters." } },
    { do: "Find the largest objects actually stored.",
      cmd: "git verify-pack -v .git/objects/pack/*.idx | sort -k 3 -n | tail -10" },
    { do: "Identify which file each hash belongs to.",
      cmd: "git rev-list --objects --all | grep <object-hash>" },
    { do: "If the file is still needed, move it and its history into Git LFS.",
      cmd: "git lfs install\ngit lfs track \"*.mp4\"\ngit lfs migrate import --include=\"*.mp4\"",
      warn: "Rewrites history. Coordinate with anyone else who has a clone." },
    { do: "If it should never have been committed, remove it entirely.",
      cmd: "git filter-repo --path path/to/huge.zip --invert-paths",
      warn: "Rewrites every commit hash." },
    { do: "Reclaim the disk space and measure again.",
      cmd: "git reflog expire --expire=now --all\ngit gc --prune=now --aggressive\ngit count-objects -vH" }
  ],
  after: "Add the pattern to .gitignore in the same commit, or it will happen again.",
  related: ["maintenance", "advanced"]
}
];

/* The wizard: two questions, then a playbook. Kept shallow on purpose —
   people arrive here stressed, and a deep decision tree is its own problem. */

const WIZARD = {
  q: "What happened?",
  options: [
    { label: "I lost work or commits", hint: "Commits or edits have disappeared",
      next: { q: "How did they disappear?", options: [
        { label: "I deleted a branch", play: "lost-commit" },
        { label: "I ran reset --hard", play: "hard-reset-oops" },
        { label: "Commits vanished after a rebase or pull", play: "lost-commit" },
        { label: "Uncommitted edits are gone", play: "lost-uncommitted" }
      ] } },

    { label: "I committed in the wrong place", hint: "Wrong branch, wrong message, wrong files",
      next: { q: "What is wrong with it?", options: [
        { label: "It went to the wrong branch", play: "wrong-branch" },
        { label: "The commit message is wrong", play: "wrong-message" },
        { label: "The branch is a mess of wip commits", play: "tidy-history" },
        { label: "I committed a secret", play: "pushed-secret" }
      ] } },

    { label: "A merge or rebase went wrong", hint: "Conflicts, or a merge that broke things",
      next: { q: "Where are you right now?", options: [
        { label: "Git is asking me to resolve conflicts", play: "resolve-conflict" },
        { label: "I want out of this operation entirely", play: "conflict-abort" },
        { label: "The merge is done and it broke something", play: "bad-merge" }
      ] } },

    { label: "I cannot push or pull", hint: "Git is rejecting the operation",
      next: { q: "What is it telling you?", options: [
        { label: "The remote has work I do not have", play: "push-rejected" },
        { label: "I am on a commit, not a branch", play: "detached-head" },
        { label: "Something else — I have the exact error text", jump: "fix-assistant" }
      ] } },

    { label: "I pushed something I should not have", hint: "A secret, or a very large file",
      next: { q: "What went up?", options: [
        { label: "A secret, key or .env file", play: "pushed-secret" },
        { label: "A huge file slowing the repo down", play: "big-file" },
        { label: "Commits on the wrong branch", play: "wrong-branch" }
      ] } },

    { label: "Nothing is broken — show me the steps", hint: "The everyday sequences",
      next: { q: "What are you doing?", options: [
        { label: "Starting a feature and opening a PR", play: "feature-pr" },
        { label: "Updating my fork from upstream", play: "update-fork" },
        { label: "Moving unfinished work to another branch", play: "move-work" },
        { label: "Cutting a release", play: "release-tag" }
      ] } }
  ]
};

if (typeof module !== "undefined") { module.exports = { PLAYBOOKS, WIZARD }; }