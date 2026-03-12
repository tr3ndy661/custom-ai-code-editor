Add-Type -AssemblyName System.Drawing

# Create a simple icon bitmap
$size = 256
$bitmap = New-Object System.Drawing.Bitmap($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Fill with a gradient background
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point($size, $size)),
    [System.Drawing.Color]::FromArgb(14, 99, 156),
    [System.Drawing.Color]::FromArgb(17, 119, 187)
)
$graphics.FillRectangle($brush, 0, 0, $size, $size)

# Draw "AI" text
$font = New-Object System.Drawing.Font("Arial", 120, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$graphics.DrawString("AI", $font, $textBrush, 40, 60)

# Save as PNG files
$bitmap.Save("$PSScriptRoot\src-tauri\icons\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Create different sizes
$sizes = @(32, 128, 256)
foreach ($s in $sizes) {
    $resized = New-Object System.Drawing.Bitmap($s, $s)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($bitmap, 0, 0, $s, $s)
    $resized.Save("$PSScriptRoot\src-tauri\icons\${s}x${s}.png", [System.Drawing.Imaging.ImageFormat]::Png)
    if ($s -eq 128) {
        $resized.Save("$PSScriptRoot\src-tauri\icons\128x128@2x.png", [System.Drawing.Imaging.ImageFormat]::Png)
    }
    $g.Dispose()
    $resized.Dispose()
}

# Create ICO file (Windows icon)
$icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
$stream = [System.IO.File]::Create("$PSScriptRoot\src-tauri\icons\icon.ico")
$icon.Save($stream)
$stream.Close()

# Create ICNS placeholder (macOS icon - just copy PNG)
Copy-Item "$PSScriptRoot\src-tauri\icons\icon.png" "$PSScriptRoot\src-tauri\icons\icon.icns"

$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Icons generated successfully!" -ForegroundColor Green