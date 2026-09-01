# Registrar com.easydyt.host en el Registro de Windows para Chrome, Edge y Brave
$ManifestPath = "C:\Users\thisuser\.gemini\antigravity\scratch\yt-downloader-extension\native_host\com.easydyt.host.json"

$RegistryPaths = @(
    "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.easydyt.host",
    "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.easydyt.host",
    "HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.easydyt.host"
)

foreach ($RegPath in $RegistryPaths) {
    try {
        if (!(Test-Path $RegPath)) {
            New-Item -Path $RegPath -Force | Out-Null
        }
        Set-ItemProperty -Path $RegPath -Name "(Default)" -Value $ManifestPath -Force
        Write-Host "Registrado exitosamente en: $RegPath"
    } catch {
        Write-Warning "No se pudo registrar en $RegPath : $_"
    }
}
