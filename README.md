# Contribution Guide

This document outlines the step-by-step process for contributing to the project by creating a new branch, making changes, and submitting a Pull Request (PR).

## Step 1: Pull the Latest Changes

Before starting any new work, it's important to ensure your local copy of the repository is up to date with the latest changes from the `main` branch.

Run the following command to pull the latest changes:

```bash
git pull origin main
```

## Step 2: Create a New Branch

Always create a new branch for your changes. This helps in keeping your work organized and separates it from the main codebase.

To create a new branch, run the following command:

```bash
git checkout -b feature-branch
```
Replace feature-branch with a descriptive name for the feature or fix you're working on.


## Step 3: Make Changes and Commit

Make your changes to the codebase. After making the necessary changes, you need to stage and commit them.

To stage all the changes, run:

```bash
git add .
```
Next, commit the changes with a meaningful commit message:

```bash
git commit -m "Brief description of the changes"
```
Make sure the commit message clearly explains what was changed.

## Step 4: Push the Branch

Once you've committed your changes, it's time to push your branch to the remote repository.

Run the following command to push your new branch:

```bash
git push origin feature-branch
```

Make sure to replace feature-branch with the actual name of your branch.

## Step 5: Create a Pull Request
After pushing your branch, you'll need to create a Pull Request (PR) to propose your changes for review. Here's how to do it:

##### 1. Go to the Repository on GitHub:
Open your web browser and navigate to the repository on GitHub.

##### 2. Select Your Branch:

On the repository page, click the branch dropdown and select the branch you just pushed (e.g., feature-branch).
##### 3. Click on "Compare & Pull Request":

GitHub will display a "Compare & pull request" button if your branch has new commits. Click this button.

If you don't see this, go to the Pull Requests tab and click "New Pull Request".

##### 4. Review the Changes:

GitHub will show the changes you've made in the PR interface. Review them to ensure they are correct.
##### 5. Write a Description:

Add a title and description for the PR explaining the changes you've made and why.
##### 6. Submit the Pull Request:

Once you're satisfied, click "Create Pull Request" to submit it.
