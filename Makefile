.PHONY: default
default:
	echo "Please Specify The Packaged APP ... "

.PHONY: darwin_universal
darwin_universal:
	wails build --platform darwin/universal
	mv -f ./build/bin/grove-studio.app ./build/bin/grove-studio-darwin-universal.app

.PHONY: windows_amd64
windows_amd64:
	wails build --platform windows/amd64 -skipbindings -o grove-studio-windows-amd64.exe

.PHONY: all
all:
	make darwin_universal
	make windows_amd64

