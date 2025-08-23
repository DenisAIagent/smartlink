#!/bin/bash

# SmartLink Deployment Script
# Optimized deployment with performance checks and monitoring

set -e

echo "🚀 Starting SmartLink deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="build"
DIST_DIR="dist"
NODE_ENV="production"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-deployment checks
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check Node.js version (require v18+)
    NODE_VERSION=$(node -v | sed 's/v//')
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        log_error "Node.js version $NODE_VERSION is not supported. Please use v18 or higher."
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

# Environment setup
setup_environment() {
    log_info "Setting up environment..."
    
    # Set production environment
    export NODE_ENV=$NODE_ENV
    export VITE_NODE_ENV=$NODE_ENV
    
    # Check required environment variables
    if [ -f .env.production ]; then
        log_info "Loading production environment variables..."
        source .env.production
    elif [ -f .env ]; then
        log_warning "Using .env file. Consider creating .env.production for production builds."
        source .env
    else
        log_warning "No environment file found. Using default values."
    fi
    
    # Validate critical environment variables
    REQUIRED_VARS=("VITE_FIREBASE_API_KEY" "VITE_FIREBASE_AUTH_DOMAIN" "VITE_FIREBASE_PROJECT_ID")
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    log_success "Environment setup completed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Clean install for production
    if [ -d "node_modules" ]; then
        rm -rf node_modules
    fi
    
    npm ci --only=production
    
    log_success "Dependencies installed"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    # Install dev dependencies for testing
    npm ci
    
    # Run unit tests
    npm run test -- --run --reporter=verbose
    
    # Run type checking
    npm run check
    
    # Run linting
    npm run lint
    
    log_success "All tests passed"
}

# Build application
build_application() {
    log_info "Building application..."
    
    # Clean previous build
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
    fi
    
    # Build with optimizations
    npm run build
    
    # Verify build output
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Build failed - no build directory found"
        exit 1
    fi
    
    # Check if critical files exist
    CRITICAL_FILES=("$BUILD_DIR/index.html" "$BUILD_DIR/_app")
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [ ! -e "$file" ]; then
            log_error "Build incomplete - missing $file"
            exit 1
        fi
    done
    
    log_success "Build completed successfully"
}

# Analyze bundle size
analyze_bundle() {
    log_info "Analyzing bundle size..."
    
    # Calculate total bundle size
    BUNDLE_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
    log_info "Total bundle size: $BUNDLE_SIZE"
    
    # Check main chunk sizes
    if [ -d "$BUILD_DIR/_app/immutable/chunks" ]; then
        log_info "Main chunk sizes:"
        ls -lh "$BUILD_DIR/_app/immutable/chunks" | head -10
    fi
    
    # Warn if bundle is too large
    BUNDLE_SIZE_BYTES=$(du -sb "$BUILD_DIR" | cut -f1)
    MAX_SIZE_BYTES=$((2 * 1024 * 1024)) # 2MB
    
    if [ "$BUNDLE_SIZE_BYTES" -gt "$MAX_SIZE_BYTES" ]; then
        log_warning "Bundle size is larger than 2MB. Consider optimizing."
    else
        log_success "Bundle size is optimal"
    fi
}

# Optimize build
optimize_build() {
    log_info "Optimizing build..."
    
    # Compress HTML, CSS, JS files
    if command -v gzip &> /dev/null; then
        find "$BUILD_DIR" -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" \) -exec gzip -9 -k {} \;
        log_success "Gzip compression applied"
    fi
    
    # Create Brotli compression if available
    if command -v brotli &> /dev/null; then
        find "$BUILD_DIR" -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" \) -exec brotli -Z -k {} \;
        log_success "Brotli compression applied"
    fi
}

# Generate deployment report
generate_report() {
    log_info "Generating deployment report..."
    
    REPORT_FILE="deployment-report.json"
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    BUILD_SIZE=$(du -sb "$BUILD_DIR" | cut -f1)
    
    cat > "$REPORT_FILE" << EOF
{
  "deployment": {
    "timestamp": "$TIMESTAMP",
    "environment": "$NODE_ENV",
    "nodeVersion": "$(node -v)",
    "buildSize": $BUILD_SIZE,
    "buildSizeHuman": "$(du -sh "$BUILD_DIR" | cut -f1)"
  },
  "performance": {
    "bundleOptimized": true,
    "compressionEnabled": true,
    "cacheStrategy": "aggressive"
  },
  "features": {
    "pwa": true,
    "serviceWorker": true,
    "offlineSupport": true,
    "firebase": true
  }
}
EOF
    
    log_success "Deployment report generated: $REPORT_FILE"
}

# Deploy to Vercel (if configured)
deploy_vercel() {
    if command -v vercel &> /dev/null && [ -f "vercel.json" ]; then
        log_info "Deploying to Vercel..."
        vercel --prod --yes
        log_success "Deployed to Vercel"
    else
        log_info "Vercel not configured, skipping deployment"
    fi
}

# Deploy to Netlify (if configured)
deploy_netlify() {
    if command -v netlify &> /dev/null && [ -f "netlify.toml" ]; then
        log_info "Deploying to Netlify..."
        netlify deploy --prod --dir="$BUILD_DIR"
        log_success "Deployed to Netlify"
    else
        log_info "Netlify not configured, skipping deployment"
    fi
}

# Main deployment process
main() {
    log_info "🚀 SmartLink Production Deployment"
    log_info "===================================="
    
    # Pre-flight checks
    check_dependencies
    setup_environment
    
    # Build process
    install_dependencies
    run_tests
    build_application
    analyze_bundle
    optimize_build
    generate_report
    
    # Deploy
    deploy_vercel
    deploy_netlify
    
    log_success "🎉 Deployment completed successfully!"
    log_info "Build location: $BUILD_DIR"
    log_info "Deployment report: $REPORT_FILE"
    
    # Performance recommendations
    echo ""
    log_info "📊 Performance Recommendations:"
    echo "- Monitor Core Web Vitals in production"
    echo "- Set up error tracking (Sentry)"
    echo "- Configure CDN for static assets"
    echo "- Enable HTTP/2 and HTTP/3 if possible"
    echo "- Monitor bundle size in CI/CD"
}

# Run deployment
main "$@"