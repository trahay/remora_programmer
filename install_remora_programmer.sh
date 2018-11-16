#!/bin/bash

prefix=$(dirname $0)

# initialize the database
bash ${prefix}/init_db.sh

# install the cron hook
bash ${prefix}/install_cron.sh

# install the remora service
sudo bash ${prefix}/install_systemctl_service.sh

