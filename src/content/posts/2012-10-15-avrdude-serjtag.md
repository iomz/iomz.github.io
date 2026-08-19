---
title: "MacPortsを入れないで avrdude+serjtag を動かす"
categories:
  - How-to
tags:
  - AVRDUDE
  - macOS
locale: "ja-JP"
---

*The original post is [https://iomz.hatenadiary.org/entry/20121015](https://iomz.hatenadiary.org/entry/20121015) and was migrated to this site.*

先日、OSX Lionをクリーンインストールした際にHomebrewへ移行したが、

```console
% brew install avrdude --with-serjtag
```

だとうまく入らない。

[FT232RL USBシリアル変換モジュール](http://akizukidenshi.com/catalog/g/gK-01977/)で読み書きするのに必要な`duemilanove`というprogrammer idがデフォルトで入っていないのが原因だ。

MacPortsで動いていたのだからその通りにコンパイルすれば動くんじゃないかと思ったら動いたので書き留める。

# 1\. FTDI用のD2XXドライバを入れる

[http://www.ftdichip.com/Drivers/D2XX.htm](http://www.ftdichip.com/Drivers/D2XX.htm)

# 2\. avrdude@5.11.1とPatchファイルすべてをダウンロードしてくる

[AVR Downloader/UploaDEr - Summary](http://savannah.nongnu.org/projects/avrdude/)

- `avrdude-5.11.1.tar.gz`

[AVR Downloader/UploaDEr - Patches: patch #6886, Support for ftdi bitbang](https://savannah.nongnu.org/patch/?6886)

- `patch-Makefile.in.diff`
- `patch-avrdude.conf.in.diff`
- `patch-avr910.c.diff`
- `patch-config\_gram.y.diff`
- `patch-lexer.l.diff`
- `patch-ft245r.h.diff`
- `patch-ft245r.c.diff`
- `patch-serjtag.h.diff`
- `patch-serjtag.c.diff`

# 3\. Patchを充ててインストールする

```sh
tar zxvf avrdude-5.11.1.tar.gz
cd avrdude-5.11.1
patch -p0 < ../\*.diff
./config CFLAGS="-g -O2 -DSUPPORT\_FT245R" LIBS="-lftd2xx" && make
sudo make install
```

これで、

```console
% which avrdude
/usr/local/bin/avrdude
% avrdude -v

avrdude: Version 5.11.1, compiled on Oct 16 2012 at 02:01:53
         Copyright (c) 2000\-2005 Brian Dean, http://www.bdmicro.com/
         Copyright (c) 2007\-2009 Joerg Wunsch

         System wide configuration file is "/usr/local/etc/avrdude.conf"
         User configuration file is "/Users/iomz/.avrduderc"
         User configuration file does not exist or is not a regular file, skipping

avrdude: no programmer has been specified on the command line or the config file
         Specify a programmer using the -c option and try again
```

となっていれば動く。
