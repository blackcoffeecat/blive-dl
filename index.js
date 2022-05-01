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
      protocol: '0',
      format: '0',
      codec: '0',
      qn: '10000',
      platform: 'web',
    }
  }).json();

  const object = res.data.playurl_info.playurl.stream.at(0).format.at(0).codec.at(0);
  const m3u8 = `${object.url_info.at(-1).host}${object.base_url}${object.url_info.at(-1).extra}`;

  if (background) {
    spawn('youtube-dl', [m3u8, '-o', filename], {cwd, detached: true, stdio: 'ignore'})
      .once('spawn', function () { this.unref(); });
  } else {
    spawn('youtube-dl', [m3u8, '-o', filename], {cwd, stdio: 'inherit'});
  }
}
