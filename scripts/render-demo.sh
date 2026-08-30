#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
assets_dir="$repo_dir/docs/assets"
font="/System/Library/Fonts/SFNSMono.ttf"

ffmpeg -y -hide_banner \
  -loop 1 -framerate 30 -i "$assets_dir/helios-initial.png" \
  -loop 1 -framerate 30 -i "$assets_dir/helios-first-light.png" \
  -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 \
  -filter_complex "
    [0:v]scale=1280:720,setsar=1,split=3[i0][i1][i2];
    [1:v]scale=1280:720,setsar=1,split=3[e0][e1][e2];

    [i0]trim=duration=8,setpts=PTS-STARTPTS,eq=brightness=-0.36,
      drawbox=x=0:y=0:w=iw:h=ih:color=black@0.22:t=fill,
      drawtext=fontfile='$font':expansion=none:text='RUIN // HELIOS':fontcolor=0xffb456:fontsize=54:x=(w-text_w)/2:y=245,
      drawtext=fontfile='$font':expansion=none:text='Mission control for a star-sized distributed system':fontcolor=white:fontsize=22:x=(w-text_w)/2:y=325,
      drawtext=fontfile='$font':expansion=none:text='A deterministic 10,000-node failure campaign':fontcolor=0x88a0a6:fontsize=17:x=(w-text_w)/2:y=375,
      fade=t=in:st=0:d=0.7,fade=t=out:st=7.3:d=0.7[v0];

    [i1]trim=duration=12,setpts=PTS-STARTPTS,
      drawbox=x=0:y=620:w=iw:h=100:color=0x05080d@0.90:t=fill,
      drawtext=fontfile='$font':expansion=none:text='10,000 INDEPENDENT COLLECTORS // 0.40 AU':fontcolor=0x64f3c2:fontsize=22:x=48:y=644,
      drawtext=fontfile='$font':expansion=none:text='Per-node health, communications, thermal state and safe power dispatch':fontcolor=white:fontsize=15:x=48:y=681,
      fade=t=in:st=0:d=0.7,fade=t=out:st=11.3:d=0.7[v1];

    [e0]trim=duration=14,setpts=PTS-STARTPTS,
      drawbox=x=0:y=620:w=iw:h=100:color=0x05080d@0.90:t=fill,
      drawtext=fontfile='$font':expansion=none:text='ONE COMMAND RUNS THE COMMISSIONED FAILURE CAMPAIGN':fontcolor=0xffb456:fontsize=20:x=48:y=644,
      drawtext=fontfile='$font':expansion=none:text='Blackout -> demand spike -> manufacturing -> thermal wave -> debris avoidance':fontcolor=white:fontsize=14:x=48:y=681,
      fade=t=in:st=0:d=0.7,fade=t=out:st=13.3:d=0.7[v2];

    [e1]crop=760:427:260:90,scale=1280:720,setsar=1,trim=duration=16,setpts=PTS-STARTPTS,
      drawbox=x=0:y=618:w=iw:h=102:color=0x05080d@0.92:t=fill,
      drawtext=fontfile='$font':expansion=none:text='EVIDENCE, NOT A SCREENSHOT':fontcolor=0x64f3c2:fontsize=22:x=48:y=642,
      drawtext=fontfile='$font':expansion=none:text='Six checkpoints // five executable invariants // replay hash 783c8d11':fontcolor=white:fontsize=15:x=48:y=680,
      fade=t=in:st=0:d=0.7,fade=t=out:st=15.3:d=0.7[v3];

    [e2]trim=duration=12,setpts=PTS-STARTPTS,
      drawbox=x=0:y=620:w=iw:h=100:color=0x05080d@0.90:t=fill,
      drawtext=fontfile='$font':expansion=none:text='SAFE-STATE RECOVERY IS PART OF THE MODEL':fontcolor=0x64f3c2:fontsize=21:x=48:y=644,
      drawtext=fontfile='$font':expansion=none:text='Availability 70.0% -> 100.0% // 149 evasive burns // 1 collector replaced':fontcolor=white:fontsize=14:x=48:y=681,
      fade=t=in:st=0:d=0.7,fade=t=out:st=11.3:d=0.7[v4];

    [i2]trim=duration=10,setpts=PTS-STARTPTS,eq=brightness=-0.40,
      drawbox=x=0:y=0:w=iw:h=ih:color=black@0.28:t=fill,
      drawtext=fontfile='$font':expansion=none:text='I BUILD SYSTEMS WHERE SILENT FAILURE IS UNACCEPTABLE.':fontcolor=white:fontsize=23:x=(w-text_w)/2:y=255,
      drawtext=fontfile='$font':expansion=none:text='FROM RADIOTHERAPY TO AUTONOMOUS SPACE INFRASTRUCTURE':fontcolor=0xffb456:fontsize=18:x=(w-text_w)/2:y=320,
      drawtext=fontfile='$font':expansion=none:text='nightandweather.github.io/ruin':fontcolor=0x64f3c2:fontsize=22:x=(w-text_w)/2:y=395,
      fade=t=in:st=0:d=0.7,fade=t=out:st=9.3:d=0.7[v5];

    [v0][v1][v2][v3][v4][v5]concat=n=6:v=1:a=0,fps=30,settb=1/30,format=yuv420p[outv]
  " \
  -map "[outv]" -map 2:a -t 72 \
  -c:v libx264 -preset slow -crf 20 -profile:v high -level:v 4.0 -movflags +faststart \
  -c:a aac -b:a 96k \
  "$assets_dir/ruin-first-light-72s.mp4"

echo "Rendered $assets_dir/ruin-first-light-72s.mp4"
