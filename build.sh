#!/bin/bash
echo "====================================="
echo "Building Education Platform"
echo "====================================="

# عرض الملفات الموجودة
echo "Current directory: $(pwd)"
ls -la

# التحقق من وجود package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    exit 1
fi

# إذا لم يكن هناك package-lock.json، قم بإنشائه
if [ ! -f "package-lock.json" ]; then
    echo "📦 Creating package-lock.json..."
    npm install --package-lock-only
    echo "✅ package-lock.json created"
fi

# تثبيت dependencies باستخدام lock file
echo "📦 Installing dependencies..."
npm ci --production=false

echo "✅ Build completed successfully!"
