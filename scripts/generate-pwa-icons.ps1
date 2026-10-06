Add-Type -AssemblyName System.Drawing

$publicDirectory = Join-Path $PSScriptRoot '..\public'
$fontPath = 'C:\Windows\Fonts\arialbd.ttf'

foreach ($size in @(192, 512)) {
  $bitmap = [System.Drawing.Bitmap]::new($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#fff8e7'))

  $darkBrush = [System.Drawing.SolidBrush]::new(
    [System.Drawing.ColorTranslator]::FromHtml('#20211d')
  )
  $redBrush = [System.Drawing.SolidBrush]::new(
    [System.Drawing.ColorTranslator]::FromHtml('#df382b')
  )
  $yellowBrush = [System.Drawing.SolidBrush]::new(
    [System.Drawing.ColorTranslator]::FromHtml('#f5c842')
  )

  $margin = [single]($size * 0.12)
  $signSize = [single]($size * 0.76)
  $graphics.FillEllipse($darkBrush, $margin + ($size * 0.025), $margin + ($size * 0.035), $signSize, $signSize)
  $graphics.FillEllipse($yellowBrush, $margin, $margin, $signSize, $signSize)
  $stripeHeight = [single]($size * 0.16)
  $graphics.FillRectangle($redBrush, $margin, ($size - $stripeHeight) / 2, $signSize, $stripeHeight)

  $fontFamily = [System.Drawing.Text.PrivateFontCollection]::new()
  $fontFamily.AddFontFile($fontPath)
  $font = [System.Drawing.Font]::new(
    $fontFamily.Families[0],
    [single]($size * 0.28),
    [System.Drawing.FontStyle]::Bold,
    [System.Drawing.GraphicsUnit]::Pixel
  )
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString('MS', $font, $darkBrush, [System.Drawing.RectangleF]::new(0, 0, $size, $size), $format)

  $outputPath = Join-Path $publicDirectory "pwa-icon-$size.png"
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $format.Dispose()
  $font.Dispose()
  $fontFamily.Dispose()
  $yellowBrush.Dispose()
  $redBrush.Dispose()
  $darkBrush.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}
