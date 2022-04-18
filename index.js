#! /usr/bin/env node
import {spawn} from 'child_process';
import {Command} from 'commander';
import dayjs from 'dayjs';
import got from 'got';
import {resolve} from 'path';

const cmd = new Command();

cmd
  .argument('<roomid>')
  .option('-b --background', 'download in background')
  .option('-d --dir <string>', 'directory')
  .action(main)
  .parse(process.argv);

async function main(roomId, opt) {
  const {background = false, dir} = opt || {};
  let cwd = process.cwd();
  if (dir) cwd = resolve(cwd, dir);

  const filename = `${roomId}-${dayjs().format('YYMMDDHHmm')}.%(ext)s`;
  const res = await got(`https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo`, {
    resolveBodyOnly: true,
    searchParams: {
      room_id: roomId,
      protocol: '0,1',
      format: '0,1,2',
      codec: '0,1',
      qn: '10000',
      platform: 'web',
      ptype: '8',
      dolby: '5',
    }
  }).json();

  const object = res.data.playurl_info.playurl.stream.at(-1).format.at(-1).codec.at(-1);
  const {base_url, url_info: [{host, extra}]} = object;
  const m3u8 = `${host}${base_url}${extra}`;

  if (background) {
    spawn('youtube-dl', [m3u8, '-o', filename], {cwd, detached: true, stdio: 'ignore'})
      .once('spawn', function () { this.unref(); });
  } else {
    spawn('youtube-dl', [m3u8, '-o', filename], {cwd, stdio: 'inherit'});
  }
}
