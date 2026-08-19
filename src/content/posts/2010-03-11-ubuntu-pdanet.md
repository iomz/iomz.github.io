---
title: "UbuntuとPdaNetのUSB Modeを使ってデザリング"
categories:
  - How-to
tags:
  - Ubuntu
  - Thethering
  - iPhone
locale: "ja-JP"
---

*The original post is [https://iomz.hatenadiary.org/entry/20100311/1268296124](https://iomz.hatenadiary.org/entry/20100311/1268296124) and was migrated to this site.*

# はじめに

ソフトバンクはiPhoneのテザリング機能を許可していないため、iPhoneをテザードモデムとして使うことは自己責任で行ってください。

JailBreakしたiPhoneも無保証です。

> iPhone 3G Sはパソコンからインターネットに接続する際のモデムとして利用できるテザリング機能を備えているのに，日本では利用できない。理由は何か。 iPhoneのユーザーは一般ユーザーの10倍のパケットを使う。そこにテザリング機能を利用可能にしたら，100倍，200倍のパケットを使う人が出てくるだろう。定額料金でデータ容量が増えるのは投資効率が悪い。一部のユーザーが求める機能を提供するために，100人分の帯域を占拠させるのは，他のユーザーに申し訳ない。通信料金が青天井ならばテザリング機能も容認する。欧米でもその例が多いようだ。
>
> [「iPhone 3G Sのテザリング機能は定額料金では成り立たない」，ソフトバンク株主総会より \| 日経 xTECH（クロステック）](http://itpro.nikkeibp.co.jp/article/NEWS/20090624/332517/)

# PdaNetとUbuntu

JailBreakしたiPhoneはCydiaを通じて多数あるApple非認可のAppを利用出来たり、root権限を持つことによってOpenSSHやBluetooth等を使ってiPhoneの中身を参照・改変が可能になります。

PdaNetはiPhoneをモデム化することにより、圏外以外のどこからでも手軽に外部デバイス用のインターネット環境を得ることが出来ます。
リリース当初は「充電しながらでもバッテリーが減っていく」という電力消費凄まじき猛々しいアプリでしたが、現在では改善され、iPhone自体の性能向上とともに何ら問題なく使うことが可能になりました。

PdaNetをワイヤレスルーターとして使う場合、AdHocネットワークを構築できるデバイスならそのままWiFiとして繋げられますが、USB経由で接続したいときはデスクトップクライアントソフト(参照)を使うことになります。
USB ModeのPdaNetはiPhone側とクライアント側に分かれ、クライアント側はPPPフレームをやり取りさせる偽装ドライバーの役目を持ちます。
iPhoneをインターネットデバイスとして‘誤認識’させてパケット通信を行うわけです。

しかし、このクライアントソフトはWindowsとMac用のリリースしかないので、Ubuntuでどうにか動くようにできないかと探していたところ、`umux2007.py`(参照)というPythonスクリプトを作った方がいらっしゃったので、PdaNet USB Mode on Ubuntuの手順を日本語でもまとめておくことにしました。

Ubuntu Forumのわかりやすい英語版は[こちら](http://ubuntu-ky.ubuntuforums.org/showthread.php?t=1351548)

# 必要なもの

( )内は今回私が使用した環境

1. jailbreak済みiPhone (3G S OS3.1.2)[jailbreak]
2. Ubuntu (9.10 Karmic Koala)
3. PdaNet (Version 1.61)
4. usbmuxed (Version 1.0.1 https://launchpad.net/~jonabeck/+archive/ppa)
5. python-twisted
6. umux2007 (http://xzrq.net/umux2007/umux2007-0.0.1.tar.gz)

# 手順

## 1\. iPhoneへPdaNetをインストール Cydiaから普通にインストールする。

## 2\. Ubuntuへusbmuxdをインストール

Terminalから

```sh
sudo add-apt-repository ppa:jonabeck/ppa
sudo apt-get install usbmuxd
```

Launchpadのリポジトリ追加はKarmicから一行で済むようになって便利！

## 3\. python\-twistedのインストール

```sh
sudo apt-get install python-twisted
```

## 4\. umux2007をインストール

```sh
curl -O http://xzrq.net/umux2007/umux2007-0.0.1.tar.gz
tar -zxvf umux2007-0.0.1.tar.gz
cd umux2007-0.0.1/
sudo ./install
```

## 5\. インストールを確認する

iPhoneでPdaNetを起動し、右下のSettingsからUSB Modeを選択しUbuntu機と接続する。Terminalで`umux2007.py`を実行して、

```console
2010\-03\-10 17:16:43+0900 \[-\] Log opened.
2010\-03\-10 17:16:44+0900 \[-\] usbmux connected (fd 7, pid 8943)
```

こんな感じになったらオッケー。`Ctrl + C` で戻ります。

## 6\. 接続する

あとは

```sh
sudo pon umux2007
```

だけで作業は終わり。

notification area等を使っている人はGUIでの接続確認が出来ていないかも知れませんが、バックグラウンドで接続出来ている筈です。

切断するには

```sh
sudo poff
```

7\. おまけ

おまけ 一応は繋がるものの、長いタイムアウトになることがあるようです。 glibcがiPhoneをIPv6をつかうインターネットデバイスとして認識してしまう(iPhone+PdaNetのIPアドレス規格はIPv4です)ので出したAAAAクエリがタイムアウトしてしまいます。手動で直す必要があります。

```sh
sudo ip addr del ::1/128 dev lo
```

アプリケーションの設定でも同様の事態が起こり得ます。
例えばfirefoxであればabout:configから`network.dns.disableIPv6`を有効にしましょう。

# 参考サイトまとめ

- [http://ubuntu-ky.ubuntuforums.org/showthread.php?t=1351548](http://ubuntu-ky.ubuntuforums.org/showthread.php?t=1351548)
- [umux2007: iPhone USB tethering under Linux](http://xzrq.net/umux2007/)
- [PPA for Jonathan Beck : Jonathan Beck](https://launchpad.net/~jonabeck/+archive/ppa)
- [PdaNet -- Use your iPhone as a Wireless Router for your PC/Mac](http://www.junefabrics.com/iphone/index.php)
