Add-Type -AssemblyName System.Drawing

$pixel = [System.Drawing.GraphicsUnit]::Pixel
$style = [System.Drawing.FontStyle]::Bold
$root = Split-Path -Parent $PSScriptRoot

function New-BrandIcon {
  param(
    [int]$Size,
    [string]$Path,
    [int]$FontPx
  )
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
  }

  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.Color]::FromArgb(255, 19, 19, 19))

  $font = $null
  foreach ($name in @('Inter', 'Segoe UI')) {
    try {
      $font = New-Object System.Drawing.Font($name, $FontPx, $style, $pixel)
      if ($font) { break }
    } catch {
      $font = $null
    }
  }
  if (-not $font) {
    throw "Font olusturulamadi: $Path"
  }

  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 180, 162))
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF(0, [float]($Size * 0.03), $Size, $Size)
  $g.DrawString('K', $font, $brush, $rect, $sf)
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "font=$($font.Name) px=$FontPx path=$Path"
  $g.Dispose()
  $bmp.Dispose()
  $font.Dispose()
  $brush.Dispose()
}

New-BrandIcon -Size 1024 -Path (Join-Path $root 'assets\brand\icon-1024.png') -FontPx 720
New-BrandIcon -Size 1024 -Path (Join-Path $root 'assets\brand\adaptive-icon.png') -FontPx 460
New-BrandIcon -Size 256 -Path (Join-Path $root 'assets\brand\icon-256.png') -FontPx 180
New-BrandIcon -Size 48 -Path (Join-Path $root 'assets\brand\favicon-48.png') -FontPx 34

Copy-Item (Join-Path $root 'assets\brand\favicon.ico') (Join-Path $root 'desktop\resources\icon.ico') -Force
Copy-Item (Join-Path $root 'assets\brand\favicon.ico') (Join-Path $root 'desktop\src\renderer\favicon.ico') -Force
Copy-Item (Join-Path $root 'assets\brand\icon-1024.png') (Join-Path $root 'desktop\resources\icon.png') -Force
Copy-Item (Join-Path $root 'assets\brand\icon-1024.png') (Join-Path $root 'mobile\assets\icon.png') -Force
Copy-Item (Join-Path $root 'assets\brand\adaptive-icon.png') (Join-Path $root 'mobile\assets\adaptive-icon.png') -Force
Copy-Item (Join-Path $root 'assets\brand\favicon-48.png') (Join-Path $root 'mobile\assets\favicon.png') -Force
Copy-Item (Join-Path $root 'assets\brand\icon-256.png') (Join-Path $root 'desktop\src\renderer\icon.png') -Force
