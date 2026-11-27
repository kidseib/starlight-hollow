Unicode true
Name "Starlight Hollow"
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\Programs\Starlight Hollow"
!include "MUI2.nsh"
!include "x64.nsh"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP "Starlight Hollow requires 64-bit Windows."
    Abort
  ${EndIf}
FunctionEnd

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "${PROJECT_DIR}/windows-build/win-unpacked/*"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateShortcut "$SMPROGRAMS\Starlight Hollow.lnk" "$INSTDIR\Starlight Hollow.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\StarlightHollow" "DisplayName" "Starlight Hollow"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\StarlightHollow" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\StarlightHollow" "DisplayVersion" "${VERSION}"
SectionEnd

Section "Uninstall"
  Delete "$SMPROGRAMS\Starlight Hollow.lnk"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\StarlightHollow"
  RMDir /r "$INSTDIR"
SectionEnd
