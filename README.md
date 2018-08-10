# wasp_tool

> A Vue.js project

## Build Setup

[Download](https://www.seleniumhq.org/download/) webdriver to the directory which is available on ```$PATH``` variable

Mongodb server
``` bash
# Start server
mongod &
# or specifiy a data folder
mongod --dbpath=data &

# Stop server
mongod --shutdown
# or
mongod --dbpath=data --shutdown
```

Main server
``` bash
# install dependencies
npm install

# build and run server [production]
npm start

# build and run server [development]
npm run start-dev

# run without build again
npm run start-server
# or
node server.js
```
<br><br>
Sometimes it may set the http & https proxy and casue the network unavailable, enter the following to fix it
``` bash
unset http_proxy
unset https_proxy
```

<!-- https://vuejsdevelopers.com/2017/12/11/vue-ssr-router/ -->