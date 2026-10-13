Add-Type -AssemblyName System.Drawing

$srcLogoPath = (Resolve-Path "public/images/adra-logo.png").Path
$resDir = (Resolve-Path "android/app/src/main/res").Path

Write-Host "Source logo: $srcLogoPath"
Write-Host "Res directory: $resDir"

$densities = @(
    @{ Name = "mipmap-mdpi";    IconSize = 48;  FgSize = 108 },
    @{ Name = "mipmap-hdpi";    IconSize = 72;  FgSize = 162 },
    @{ Name = "mipmap-xhdpi";   IconSize = 96;  FgSize = 216 },
    @{ Name = "mipmap-xxhdpi";  IconSize = 144; FgSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; IconSize = 192; FgSize = 432 }
)

$srcImage = [System.Drawing.Image]::FromFile($srcLogoPath)

# Color #007A61
$brandGreen = [System.Drawing.Color]::FromArgb(255, 0, 122, 97)

foreach ($d in $densities) {
    $targetDir = Join-Path $resDir $d.Name
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    # 1. ic_launcher.png (Square / legacy)
    $bmpSquare = New-Object System.Drawing.Bitmap($d.IconSize, $d.IconSize)
    $gSquare = [System.Drawing.Graphics]::FromImage($bmpSquare)
    $gSquare.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gSquare.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gSquare.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gSquare.Clear($brandGreen)
    $gSquare.DrawImage($srcImage, 0, 0, $d.IconSize, $d.IconSize)
    $gSquare.Dispose()
    $squarePath = Join-Path $targetDir "ic_launcher.png"
    $bmpSquare.Save($squarePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpSquare.Dispose()

    # 2. ic_launcher_round.png (Circular)
    $bmpRound = New-Object System.Drawing.Bitmap($d.IconSize, $d.IconSize)
    $gRound = [System.Drawing.Graphics]::FromImage($bmpRound)
    $gRound.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gRound.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gRound.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gRound.Clear([System.Drawing.Color]::Transparent)
    
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse(0, 0, $d.IconSize, $d.IconSize)
    $gRound.SetClip($path)
    $gRound.Clear($brandGreen)
    $gRound.DrawImage($srcImage, 0, 0, $d.IconSize, $d.IconSize)
    $path.Dispose()
    $gRound.Dispose()
    $roundPath = Join-Path $targetDir "ic_launcher_round.png"
    $bmpRound.Save($roundPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpRound.Dispose()

    # 3. ic_launcher_foreground.png (Adaptive icon foreground with safe area)
    # Total canvas: FgSize x FgSize. Safe zone is ~66% of the canvas in the center.
    $bmpFg = New-Object System.Drawing.Bitmap($d.FgSize, $d.FgSize)
    $gFg = [System.Drawing.Graphics]::FromImage($bmpFg)
    $gFg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gFg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gFg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $gFg.Clear($brandGreen)

    $logoSize = [int][Math]::Round($d.FgSize * 0.68)
    $logoOffset = [int][Math]::Round(($d.FgSize - $logoSize) / 2)
    $gFg.DrawImage($srcImage, $logoOffset, $logoOffset, $logoSize, $logoSize)
    $gFg.Dispose()
    $fgPath = Join-Path $targetDir "ic_launcher_foreground.png"
    $bmpFg.Save($fgPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpFg.Dispose()

    Write-Host "Generated icons for $($d.Name): $squarePath"
}

# Also generate high-res splash screens
$splashDirs = @(
    @{ Name = "drawable"; Width = 480; Height = 800 },
    @{ Name = "drawable-port-hdpi"; Width = 480; Height = 800 },
    @{ Name = "drawable-port-mdpi"; Width = 320; Height = 480 },
    @{ Name = "drawable-port-xhdpi"; Width = 720; Height = 1280 },
    @{ Name = "drawable-port-xxhdpi"; Width = 960; Height = 1600 },
    @{ Name = "drawable-port-xxxhdpi"; Width = 1280; Height = 1920 },
    @{ Name = "drawable-land-hdpi"; Width = 800; Height = 480 },
    @{ Name = "drawable-land-mdpi"; Width = 480; Height = 320 },
    @{ Name = "drawable-land-xhdpi"; Width = 1280; Height = 720 },
    @{ Name = "drawable-land-xxhdpi"; Width = 1600; Height = 960 },
    @{ Name = "drawable-land-xxxhdpi"; Width = 1920; Height = 1280 }
)

$splashBg = [System.Drawing.Color]::FromArgb(255, 2, 6, 23) # #020617 dark slate

foreach ($s in $splashDirs) {
    $dir = Join-Path $resDir $s.Name
    if (Test-Path $dir) {
        $bmpSplash = New-Object System.Drawing.Bitmap($s.Width, $s.Height)
        $gSplash = [System.Drawing.Graphics]::FromImage($bmpSplash)
        $gSplash.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gSplash.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gSplash.Clear($splashBg)

        # Center the ADRA logo on the splash
        $minDim = [Math]::Min($s.Width, $s.Height)
        $logoDim = [int][Math]::Round($minDim * 0.35)
        $logoX = [int][Math]::Round(($s.Width - $logoDim) / 2)
        $logoY = [int][Math]::Round(($s.Height - $logoDim) / 2)
        $gSplash.DrawImage($srcImage, $logoX, $logoY, $logoDim, $logoDim)
        $gSplash.Dispose()

        $splashFile = Join-Path $dir "splash.png"
        $bmpSplash.Save($splashFile, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmpSplash.Dispose()
        Write-Host "Generated splash for $($s.Name)"
    }
}

$srcImage.Dispose()
Write-Host "All Android icons and splash assets successfully generated!"
