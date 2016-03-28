#!/bin/sh

# Time shift
# Berlin: GMT-2
echo "GMT-2" > /etc/TZ

# Telnet
if [ ! -f "/etc/init.d/S88telnet" ]; then
    echo "#!/bin/sh" > /etc/init.d/S88telnet
    echo "telnetd &" >> /etc/init.d/S88telnet
    chmod 755 /etc/init.d/S88telnet
fi

# FTP
echo "#!/bin/sh" > /etc/init.d/S89ftp
echo "tcpsvd -vE 0.0.0.0 21 ftpd -w / &" >> /etc/init.d/S89ftp
chmod 755 /etc/init.d/S89ftp

dr=`dirname $0`

# RTSP
if ! cmp $dr/rtspsvr /home/rtspsvr; then
    test -f /home/rtspsvr && mv /home/rtspsvr /home/rtspsvr.backup
    cp $dr/rtspsvr /home/rtspsvr
fi

# Making some space for new stuff, this beaks default YI functionality
killall watch_process
cp $dr/home/wp_cmd /home/

rm /home/web/server
rm /home/web/server.backup
rm /home/web/ocxversion
rm /home/p2pserver
rm /home/goolink
rm /home/mp4record
rm /home/cloud
rm /home/cloudAPI
rm /home/record_event
rm /home/p2p_tnp
rm /home/timeout.g726

cp -a $dr/home/* /home/
sync

# fix bootcycle
mv $dr/equip_test.sh $dr/equip_test.sh.moved
reboot
