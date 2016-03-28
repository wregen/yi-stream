# YI stream

YI stream is an attempt to make "YI Home camera" a standalone RTMP live streaming solution. Once YI is started, go to http://[YI IP] enter "Server URL" and "Stream Name" and camera will start publishing video and audio to RTMP server. It has been tested with YouTube and nginx-rtmp-module, but I believe it will work with other RTMP servers as well.

## Disclaimer

**This solution is meant for educational purposes only. If you decide to flash your YI with this software, you are the only person responsible for any damages you make. Keep in mind that it is an early stage software and it may not work. You may brick your camera, and - for sure - you are breaking warranty agreement. Moreover, this firmware modification breaks all YI default functionality: YI mobile app will not work; no recording is possible.**

## Note

YI I bought is Chinese version. The hw platform is 2. I did not tested this on any other YI versions.

## How to flash it?

Copy the content of ./sd to the root of your SD card and follow the instructions on http://xiaoyi.querex.be/.

## How does it work?

It uses ffmpeg for re-muxing and re-streaming av stream from RTSP on localhost to RTMP server. Additionaly a simple HTML UI has been made to start/stop streaming, checking an output logs and monitoring bandwidth.

## Licenses

1. ./sd/home  - contains proprietary software which I think is a property of [Xiaomi Inc.](http://www.mi.com/en/),
2. ./sd/test/*.g726 files are probably also proprty of Xiaomi Inc., I took them from [4pda.ru](http://4pda.ru/forum/index.php?showtopic=638230);
3. ./sd/test/web/lighttpd - is a [LigHttpd](http://www.lighttpd.net) web server distributed on [revised BSD license](http://www.lighttpd.net/assets/COPYING);
4. ./sd/test/avworker-min - is a modified example of [ffmpeg](http://www.ffmpeg.org) [remuxing.c](https://github.com/FFmpeg/FFmpeg/blob/master/doc/examples/remuxing.c), ffmpeg itself is compiled with GPL 2.0 license;
5. [Bootstrap](http://getbootstrap.com) is licensed under the MIT license;
6. [jQuery](http://jquery.com/]) is released under the MIT license;
7. [Flot](http://www.flotcharts.org/) is licensed under the MIT license;
8. The rest (by me) is distributed under GPL 2.0;
9. Although "YI stream" logo looks the same as the logo on http://www.xiaoyi.com/en/home.html, it is done by me;
10. let me know if I am omitting anything

## Versions

1. YI firmware is 1.8.5.1L, taken from http://xiaoyi.querex.be/;
2. Lighttpd is 1.4.39;
3. ffmpeg is N-78887-g21234c8

# FAQ (initial)

###### Is this software secure?

Absolutely, not. HTTP of the camera is wide open. Please do not expose it to open Internet.

###### Does it communicates to Xiaomi servers?

I do not think so. I have removed: /home/cloud and /home/goolink.

###### How did I build the software?

First, I took Hi3518_SDK_V1.0.7.0.tgz, links can be found on http://nemon.org/ipcam-ipr1631x/. Then compiled lighttpd and ffmpeg with the arm-hisiv100-linux, wrote simple cgi and html/js gui.

###### What else has been removed?

Check ./sd/test/equip_test.sh (at the end of the file) for all the files that I am removing from /home directory.

###### Do RTSP, Telnet and FTP work?

Yes.

###### Why it cannot stream HD?

The top command shows that ./rmm process takes ~297.4 of %MEM, while ./rtspsvr takes ~86.4 of %MEM. When I am starting avworker-min the out of memory killer kills it. I was able to stream HD, when I killed all processes except rmm and rtspsrv (killall log_server && killall watch_process && killall led_ctl && killall tcpsvd && killall telnetd), but it cannot be treated as a solution. Perhaps you will find a solution for this.
