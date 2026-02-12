# İkonları v4'ten kopyala
Copy-Item "D:\Projects\uyap\uyap-evrak-yonetici v4\icons\icon16.png" "D:\Projects\uyap\uyap-evrak-indirici\icons\"
Copy-Item "D:\Projects\uyap\uyap-evrak-yonetici v4\icons\icon48.png" "D:\Projects\uyap\uyap-evrak-indirici\icons\"
Copy-Item "D:\Projects\uyap\uyap-evrak-yonetici v4\icons\icon128.png" "D:\Projects\uyap\uyap-evrak-indirici\icons\"

# Gereksiz klasörü sil
Remove-Item "D:\Projects\uyap\uyap-evrak-indirici\icons_old" -Force -Recurse

Write-Host "İkonlar kopyalandı!" -ForegroundColor Green
