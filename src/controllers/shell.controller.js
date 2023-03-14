import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';

const videoStorage = multer.diskStorage({
  destination: (req, files, cb) => {
    cb(null, 'videos/');
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${uniqueName}${ext}`;
    cb(null, filename);
  },
});

const videoFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(mp4|mpg|mpeg|avi|mov|mkv)$/)) {
    return cb(new Error('Only video files are allowed!'), false);
  }
  cb(null, true);
};

const videoUpload = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
}).array('videos', 10);

const convertToHls = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions('-codec copy')
      .outputOptions('-start_number 0')
      .outputOptions('-hls_time 10')
      .outputOptions('-hls_list_size 0')
      .outputOptions('-f hls')
      .output(outputPath)
      .on('progress', (progress) => {
        console.log(`Converting ${inputPath} to HLS: ${progress.percent}%`);
      })
      .on('end', () => {
        console.log('Conversion ended successfully');
        resolve();
      })
      .on('error', (error) => {
        console.error(`ffmpeg error: ${error.message}`);
        reject(error);
      })
      .run();
  });
};

const videoController = {};

videoController.uploadAndConvert = async (req, res) => {
  videoUpload(req, res, async (err) => {
    if (err) {
      console.error(err);
      res.status(500).send({ message: 'Failed to upload video' });
    } else {
      try {
        const files = req.files;
        const outputPaths = [];
        for (let i = 0; i < files.length; i++) {
          const inputPath = files[i].path;
          const outputPath = `videos/${uuidv4()}/`;
          fs.mkdirSync(outputPath);
          await convertToHls(inputPath, `${outputPath}output.m3u8`);
          outputPaths.push(outputPath);
          fs.unlinkSync(inputPath);
        }
        res.status(200).send({
          message: 'Videos uploaded and converted successfully',
          files: outputPaths,
        });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ message: 'Failed to convert video to HLS segments' });
      }
    }
  });
};

export default videoController;
