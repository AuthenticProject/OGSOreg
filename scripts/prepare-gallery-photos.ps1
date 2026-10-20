Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase

$sourceDir = "d:\00. Me\07. Code Project\10. OGSOreg\foto"
$destDir = "d:\00. Me\07. Code Project\10. OGSOreg\public\foto"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$files = Get-ChildItem -Path $sourceDir -File

$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]85)
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }

$results = @()
$counter = 1

foreach ($f in $files) {
    $ext = $f.Extension.ToLower()
    $cleanName = ("ogso-gallery-{0:d2}.jpg" -f $counter)
    $destPath = Join-Path $destDir $cleanName
    $success = $false
    $width = 0
    $height = 0

    Write-Host "Processing $($f.Name)..."

    if ($ext -eq ".heic") {
        try {
            $stream = [System.IO.File]::OpenRead($f.FullName)
            $decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create($stream, [System.Windows.Media.Imaging.BitmapCreateOptions]::None, [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
            $frame = $decoder.Frames[0]
            
            $origW = $frame.PixelWidth
            $origH = $frame.PixelHeight
            $maxDim = 1200
            $scale = [Math]::Min(1.0, [Math]::Min($maxDim / $origW, $maxDim / $origH))
            $newW = [int]($origW * $scale)
            $newH = [int]($origH * $scale)
            
            $transformed = New-Object System.Windows.Media.Imaging.TransformedBitmap($frame, (New-Object System.Windows.Media.ScaleTransform($scale, $scale)))
            $jpegEncoder = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
            $jpegEncoder.QualityLevel = 85
            $jpegEncoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($transformed))
            
            $outStream = [System.IO.File]::Create($destPath)
            $jpegEncoder.Save($outStream)
            $outStream.Close()
            $stream.Close()
            
            $width = $newW
            $height = $newH
            $success = $true
            Write-Host "  Converted HEIC -> $cleanName ($width x $height)"
        } catch {
            Write-Warning "  Failed HEIC convert: $($_.Exception.Message)"
        }
    } else {
        try {
            $bmp = [System.Drawing.Image]::FromFile($f.FullName)
            
            # Check orientation
            $propItems = $bmp.PropertyItems | Where-Object { $_.Id -eq 0x0112 }
            if ($propItems) {
                $orientation = $propItems[0].Value[0]
                if ($orientation -eq 6) { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
                elseif ($orientation -eq 8) { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
                elseif ($orientation -eq 3) { $bmp.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
            }
            
            $origW = $bmp.Width
            $origH = $bmp.Height
            $maxDim = 1200
            $scale = [Math]::Min(1.0, [Math]::Min($maxDim / $origW, $maxDim / $origH))
            $newW = [int]($origW * $scale)
            $newH = [int]($origH * $scale)
            
            $resized = New-Object System.Drawing.Bitmap($newW, $newH)
            $g = [System.Drawing.Graphics]::FromImage($resized)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $g.DrawImage($bmp, 0, 0, $newW, $newH)
            $g.Dispose()
            
            $resized.Save($destPath, $jpegCodec, $encoderParams)
            $resized.Dispose()
            $bmp.Dispose()
            
            $width = $newW
            $height = $newH
            $success = $true
            Write-Host "  Processed JPG -> $cleanName ($width x $height)"
        } catch {
            Write-Warning "  Failed JPG process: $($_.Exception.Message)"
        }
    }

    if ($success) {
        $results += [PSCustomObject]@{
            id = $counter
            originalName = $f.Name
            fileName = $cleanName
            url = "/foto/$cleanName"
            width = $width
            height = $height
        }
        $counter++
    }
}

$jsonPath = "d:\00. Me\07. Code Project\10. OGSOreg\src\constants\galleryPhotos.json"
$results | ConvertTo-Json -Depth 3 | Set-Content -Path $jsonPath -Encoding UTF8
Write-Host "Done! Successfully processed $($results.Count) photos. Output saved to $jsonPath and $destDir"
