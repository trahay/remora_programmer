#!/bin/bash

full_path="$PWD/$0"
prefix=$(dirname $full_path)
SERVER_JS=$prefix/server.js


cat 2>/dev/null > /lib/systemd/system/remora_programmer.service  <<EOF
[Unit]
Description=Remora programmer website
After=network.target
StartLimitIntervalSec=0
[Service]
Type=simple
Restart=always
RestartSec=1
User=$SUDO_USER
ExecStart=/usr/bin/nodejs $SERVER_JS

[Install]
WantedBy=multi-user.target

EOF
if [ $? -ne 0 ]; then
    echo Please run the script as sudo:
    echo sudo $0 $@
    exit 1
fi

systemctl restart remora_programmer 
