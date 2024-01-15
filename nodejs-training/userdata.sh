#!/bin/bash
curl https://s3.us-east-2.amazonaws.com/aws-xray-assets.us-east-2/xray-daemon/aws-xray-daemon-3.x.deb -o /home/ssm-user/xray.deb
sudo apt install /home/ssm-user/xray.deb
sudo systemctl start xray
sudo systemctl status xray
