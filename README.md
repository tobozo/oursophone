# OursoPhone Demo

See it here: http://assassine.org/oursophone.php 

Static Demo: http://assassine.org/oursophone.html (waveform disabled)


This is a soundcloud player demo made for fun with the help of the SoundCloud/SoundManager2 API documentations.

It'll automatically load the playlists from a given user, and let you browse/play the tracks by album or by tags.

If fully setup, it'll try to animate the player using the waveform data that SoundCloud provides.

The UI is template based (home made) and makes a strong use of advanced CSS3 features.

## Local Installation

Use the oursophone.php file if your web server can run PHP.

There is also a config.ru Rack app included so that you can serve the project locally using [Rack](http://rack.github.com)

* Make sure rack is installed

`      $ sudo gem install rack`

* Clone the git repo

`      $ git clone git@github.com:tobozo/oursophone.git`

`      $ cd oursophone`

`      $ rackup config.ru`

* Open [http://localhost:9292](http://localhost:9292) in your browser

Warning : the Rack app will relay the waveform requests just as the PHP file would, but do NOT use it in production as it will forward ANY request.

## Forking the project

You will need to update the scClientID value with your own SoundCloud user ID, which you get by [registering a new soundcloud app](http://soundcloud.com/you/apps/new).

You can change the scUserID value to a valid SoundCloud user ID and it'll automatically load the public playlists from that user.
