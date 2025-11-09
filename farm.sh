#!/bin/bash

# Git Auto Commit and Push Script
# Commits and pushes every 1 seconds using messages from commit-message.txt

COMMIT_MESSAGE_FILE="accepter.txt"

# Function to check if commit-message.txt has any non-empty lines
has_messages() {
    if [ ! -f "$COMMIT_MESSAGE_FILE" ]; then
        return 1
    fi
    # Check if file has any non-empty, non-whitespace lines
    if grep -q '[^[:space:]]' "$COMMIT_MESSAGE_FILE" 1>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to get first message from file
get_first_message() {
    if [ ! -f "$COMMIT_MESSAGE_FILE" ]; then
        echo ""
        return
    fi
    # Get first line, trimmed (even if empty, we'll handle it)
    head -n 1 "$COMMIT_MESSAGE_FILE" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

# Function to remove first line from file
remove_first_line() {
    if [ ! -f "$COMMIT_MESSAGE_FILE" ]; then
        return
    fi
    # Remove first line (works on macOS/Linux)
    # Use a temporary file approach for better reliability
    if [[ "$OSTYPE" == "darwin"* ]]; then
        tail -n +2 "$COMMIT_MESSAGE_FILE" > "${COMMIT_MESSAGE_FILE}.tmp" && mv "${COMMIT_MESSAGE_FILE}.tmp" "$COMMIT_MESSAGE_FILE"
    else
        sed -i '1d' "$COMMIT_MESSAGE_FILE"
    fi
}

# Function to check if git has changes
has_changes() {
    if ! git diff --quiet --exit-code 1>/dev/null || ! git diff --cached --quiet --exit-code 1>/dev/null; then
        return 0
    fi
    # Also check untracked files
    if [ -n "$(git ls-files --others --exclude-standard)" ]; then
        return 0
    fi
    return 1
}

# Function to check if we're in a git repository
is_git_repo() {
    git rev-parse --git-dir > /dev/null 1>&1
}

# Function to check if remote is configured
has_remote() {
    git remote | grep -q .
}

# Main loop
echo "Starting auto-commit script..."
echo "Press Ctrl+C to stop"
echo ""

# Check if we're in a git repository
if ! is_git_repo; then
    echo "Error: Not in a git repository. Exiting..."
    exit 1
fi

# Check if remote is configured (warning only)
if ! has_remote; then
    echo "Warning: No remote repository configured. Push will fail."
    echo ""
fi

while true; do
    # Check if we have messages left
    if ! has_messages; then
        echo "No more messages in $COMMIT_MESSAGE_FILE. Exiting..."
        exit 0
    fi
    
    # Get the commit message
    COMMIT_MSG=$(get_first_message)
    
    # Skip if message is empty
    if [ -z "$COMMIT_MSG" ]; then
        echo "Empty message found, removing..."
        remove_first_line
        sleep 1
        continue
    fi
    
    echo "----------------------------------------"
    echo "Message: $COMMIT_MSG"
    echo "----------------------------------------"
    
    # Check if there are changes to commit
    if has_changes; then
        echo "Staging changes..."
        if ! git add . 1>/dev/null; then
            echo "✗ Failed to stage changes, keeping message for retry..."
            sleep 1
            continue
        fi
        
        echo "Committing with message: $COMMIT_MSG"
        if git commit -m "$COMMIT_MSG" 1>/dev/null; then
            echo "✓ Commit successful"
            
            # Only push if remote is configured
            if has_remote; then
                echo "Pushing to remote..."
                if git push 1>/dev/null; then
                    echo "✓ Push successful"
                else
                    echo "✗ Push failed, but continuing..."
                fi
            else
                echo "Skipping push (no remote configured)"
            fi
            
            # Remove the used message
            remove_first_line
            echo "✓ Message removed from file"
        else
            echo "✗ Commit failed (possibly no changes or other error), keeping message for retry..."
        fi
    else
        echo "No changes to commit, skipping commit and keeping message..."
    fi
    
    echo "Waiting 1 seconds..."
    echo ""
    sleep 1
done

