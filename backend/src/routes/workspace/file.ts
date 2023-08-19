import express from 'express';
import multer from '../../middlewares/multer.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 上传文件接口
router.post('/file/:filepath', multer.single('file'), (req, res) => {
  res.sendStatus(200); // 文件上传成功
});

router.get('/filelist/:filepath', async (req, res) => {
  const { workspaceid, filepath } = req.params;
  const full = path.join(config.dirs.workspace, workspaceid, filepath);

  try {
    const exists = await fs.promises.exists(full);
    if (!exists) {
      res.sendStatus(404);
      return;
    }

    const stats = await fs.promises.stat(full);
    if (stats.isDirectory()) {
      const files = await getFolderTree(full);
      res.json(files);
    } else {
      res.sendStatus(500);
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

async function getFolderTree(folderPath) {
  const files = await fs.promises.readdir(folderPath);
  const tree = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = await fs.promises.stat(filePath);
    const node = {
      name: file,
      isDirectory: stats.isDirectory(),
    };

    if (stats.isDirectory()) {
      node.children = await getFolderTree(filePath);
    }

    tree.push(node);
  }

  return tree;
}

// 下载文件接口
router.get('/file/download/:filepath', async (req, res) => {
  const { workspaceid, filepath } = req.params;
  const full = path.join(config.dirs.workspace, workspaceid, filepath);

  try {
    const exists = await fs.promises.exists(full);
    if (!exists) {
      res.sendStatus(404);
      return;
    }

    const stats = await fs.promises.stat(full);
    if (stats.isDirectory()) {
      const files = await fs.promises.readdir(full);
      res.json(files); // TODO return zip
    } else if (stats.isFile()) {
      res.download(full, (err) => { throw err });
    } else {
      res.sendStatus(500);
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.delete('/file/:filepath', async (req, res) => {
  const { workspaceid, filepath } = req.params;
  const full = path.join(config.dirs.workspace, workspaceid, filepath);

  try {
    const exists = await fs.promises.exists(full);
    if (!exists) {
      res.sendStatus(404);
      return;
    }

    const stats = await fs.promises.stat(full);
    if (stats.isDirectory()) {
      await fs.promises.rmdir(full, { recursive: true });
      res.sendStatus(200);
    } else if (stats.isFile()) {
      await fs.promises.unlink(full);
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

export default router;