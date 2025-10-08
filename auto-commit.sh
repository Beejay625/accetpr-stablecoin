#!/bin/bash

# Auto-commit script for StableStack Backend
# Simple bash version for quick auto-commits

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="stablestack-backend"
DEFAULT_COMMIT_MSG="chore: auto-commit changes"

# Function to print colored output
print_status() {
    echo -e "${BLUE}📝${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
}

# Get changed files count
get_changed_files() {
    git status --porcelain | grep -v -E '\.(js|md)$' | wc -l | tr -d ' '
}

# Generate smart commit message based on changed files
generate_commit_message() {
    local changed_files=$(git status --porcelain | grep -v -E '\.(js|md)$')
    local message="$DEFAULT_COMMIT_MSG"
    
    # Count different types of changes
    local features=$(echo "$changed_files" | grep -E "(src/controllers|src/services|src/routes|src/providers)" | wc -l)
    local fixes=$(echo "$changed_files" | grep -E "(src/middleware|src/utils|src/db)" | wc -l)
    local docs=$(echo "$changed_files" | grep -E "(docs/)" | wc -l)
    local config=$(echo "$changed_files" | grep -E "(package\.json|tsconfig\.json|\.eslintrc|nodemon\.json|prisma/schema\.prisma)" | wc -l)
    local tests=$(echo "$changed_files" | grep -E "(test/|spec/|\.test\.|\.spec\.)" | wc -l)
    
    # Generate message based on primary change type
    if [ "$features" -gt 0 ]; then
        if [ "$features" -eq 1 ]; then
            message="feat: update feature implementation"
        else
            message="feat: update $features feature files"
        fi
    elif [ "$fixes" -gt 0 ]; then
        if [ "$fixes" -eq 1 ]; then
            message="fix: update implementation"
        else
            message="fix: update $fixes implementation files"
        fi
    elif [ "$docs" -gt 0 ]; then
        message="docs: update documentation"
    elif [ "$config" -gt 0 ]; then
        message="config: update configuration"
    elif [ "$tests" -gt 0 ]; then
        message="test: update test files"
    else
        local total=$(get_changed_files)
        message="chore: update $total files"
    fi
    
    echo "$message"
}

# Main auto-commit function
auto_commit() {
    local interactive=${1:-false}
    local dry_run=${2:-false}
    local commit_msg=${3:-""}
    
    print_status "Checking git repository..."
    check_git_repo
    
    local changed_count=$(get_changed_files)
    
    if [ "$changed_count" -eq 0 ]; then
        print_success "No changes to commit!"
        exit 0
    fi
    
    print_status "Found $changed_count changed files"
    
    # Show what files are changed (excluding .js and .md)
    echo ""
    print_status "Changed files (excluding .js and .md):"
    git status --short | grep -v -E '\.(js|md)$'
    
    # Generate commit message
    if [ -z "$commit_msg" ]; then
        commit_msg=$(generate_commit_message)
    fi
    
    echo ""
    print_status "Commit message: $commit_msg"
    
    if [ "$dry_run" = true ]; then
        print_warning "Dry run mode - no changes will be committed"
        exit 0
    fi
    
    # Interactive mode
    if [ "$interactive" = true ]; then
        echo ""
        read -p "Do you want to proceed with this commit? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Commit cancelled"
            exit 0
        fi
    fi
    
    # Stage and commit
    print_status "Staging changes..."
    git add .
    
    print_status "Committing changes..."
    git commit -m "$commit_msg"
    
    print_success "Changes committed successfully!"
    
    # Show final status
    echo ""
    print_status "Current status:"
    git status --short
}

# Watch mode function
watch_mode() {
    local interval=${1:-5}
    
    print_status "Starting watch mode (checking every ${interval}s)..."
    print_warning "Press Ctrl+C to stop"
    
    local last_commit=$(git rev-parse HEAD 2>/dev/null || echo "")
    
    while true; do
        sleep "$interval"
        
        # Check if there are changes
        local current_changes=$(get_changed_files)
        
        if [ "$current_changes" -gt 0 ]; then
            echo ""
            print_status "Changes detected at $(date '+%H:%M:%S')"
            auto_commit false false ""
        fi
    done
}

# Show help
show_help() {
    echo "Auto-commit script for $PROJECT_NAME"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -i, --interactive    Prompt before committing"
    echo "  -d, --dry-run        Show what would be committed without committing"
    echo "  -m, --message MSG    Use custom commit message"
    echo "  -w, --watch [SEC]    Watch mode - auto-commit every SEC seconds (default: 5)"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Auto-commit with smart message"
    echo "  $0 -i                        # Prompt before committing"
    echo "  $0 -d                        # Dry run - see what would be committed"
    echo "  $0 -m \"fix: resolve bug\"     # Use custom commit message"
    echo "  $0 -w                        # Watch mode every 5 seconds"
    echo "  $0 -w 10                     # Watch mode every 10 seconds"
}

# Parse command line arguments
interactive=false
dry_run=false
watch_mode_enabled=false
watch_interval=5
custom_message=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--interactive)
            interactive=true
            shift
            ;;
        -d|--dry-run)
            dry_run=true
            shift
            ;;
        -m|--message)
            custom_message="$2"
            shift 2
            ;;
        -w|--watch)
            watch_mode_enabled=true
            if [[ $2 =~ ^[0-9]+$ ]]; then
                watch_interval="$2"
                shift 2
            else
                shift
            fi
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Execute based on mode
if [ "$watch_mode_enabled" = true ]; then
    watch_mode "$watch_interval"
else
    auto_commit "$interactive" "$dry_run" "$custom_message"
fi
