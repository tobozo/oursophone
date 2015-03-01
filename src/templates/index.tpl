<oursophone id="player">
  <header id="player-header">
    <div class="waveform-holder">
      <div id="animbox"></div>
      <div id="canvas-overlay"><img class="waveform-img loader" src="{pixel-trans}" /></div>
    </div>
    <div id="controls">
      <div class="playback-controls">
        <div class="player-button" href="#a:0:b:0" data-action="backward" data-index="0"><span class="player-click">&lt;&lt;</span></div>
        <div class="player-button" href="#" data-action="play"><span class="player-click">play</span></div>
        <div class="player-button" href="#" data-action="pause"><span class="player-click">pause</span></div>
        <div class="player-button" href="#a:0:b:1" data-action="forward" data-index="0"><span class="player-click">&gt;&gt;</span></div>
        <div style="clear:both"></div>
      </div>
      <div class="volume-control">
        <label class="minus-button" data-volume-action="-">-</label>
        <input type="range" data-action="setvolume" min="0" max="1" step="0.1" />
        <label class="plus-button" data-volume-action="+">+</label>
      </div>
      <div class="search-button" title="Marre de GarD?">🔍</div>
      <div class="comments-control">
        <input type="checkbox" name="un-mute" id="un-mute" checked>
        <label for="un-mute" class="unmute">
          <img src="{pixel-trans}" class="mute-icon" alt="Mute_Icon.svg" title="Mute">
        </label>
        <label for="un-mute" class="mute">
          <img src="{pixel-trans}" class="speak-icon" alt="Speaker_Icon.svg" title="Unmute (takes effect with the next song)">
        </label>
      </div>
      <div id="player-state" data-state="zzz"></div>
      <div style="clear:both"></div>
    </div>
    <div id="flex-box">
      <div id="user-description"></div>
      <div id="track-description"></div>
      <div id="album-description" data-display-mode="list"></div>
    </div>
    <ol id="comments"></ol>
  </header>
  <div id="playlist" data-display-mode="thumb" data-tag-id="0" data-album-id="0" data-song-id="0" data-user=""></div>
</oursophone>
