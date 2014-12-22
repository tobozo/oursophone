# OursoPhone Demo

Static Demo: http://assassine.org/oursophone.html (waveform disabled)


This is a soundcloud player demo made for fun with the help of the SoundCloud/SoundManager2 API documentations.

It'll automatically load the playlists from a given user, and let you browse/play the tracks by album or by tags.

If fully setup, it'll try to animate the player using the waveform data that SoundCloud provides.

The UI is template based (home made) and makes a strong use of advanced CSS3 features.

## Local Installation


### Using php

* Deploy the www/ content on your local web server

* Access the player by visiting oursophone.php


### Using Ruby Rack

There is also a config.ru Rack app included so that you can serve the project locally using [Rack](http://rack.github.com)

* Make sure rack is installed

`      $ sudo gem install rack`

* Clone the git repo

`      $ git clone git@github.com:tobozo/oursophone.git`

`      $ cd oursophone/www`

`      $ rackup config.ru`

* Open [http://localhost:9292](http://localhost:9292) in your browser

Warning : the Rack app will relay the waveform requests just as the PHP file would, but do NOT use it in production as it will forward ANY request.


### Using Node

* Clone the git repo

`      $ git clone git@github.com:tobozo/oursophone.git`

`      $ npm install

`      $ grunt server


### Using Phonegap

* Clone the git repo

`      $ git clone git@github.com:tobozo/oursophone.git`

`      $ npm install

* Resolve all the dependancies mess

* Make sure your JAVA_HOME, ANDROID_HOME and AND_HOME are well set in your path

`      $ grunt phonegap:build

* The *.apk files are built in the oursophone/build/platforms/android/ant-build/ folder


## Theme Customization

* Create your www/css/oursophone.[theme name].CSS3

* Change the OursoPhone.config.theme value to your [theme name] in www/js/oursophone.js


## Forking the project

You will need to update the scClientID value with your own SoundCloud user ID, which you get by [registering a new soundcloud app](http://soundcloud.com/you/apps/new).

You can change the scUserID value to a valid SoundCloud user ID and it'll automatically load the public playlists from that user.
