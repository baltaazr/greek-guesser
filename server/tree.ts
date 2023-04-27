import express from 'express';
import fs from "fs";

const router = express.Router();

// @route    POST api/tree
// @desc     Update tree
// @access   Public
router.post(
  '/',
  async (req: any, res: any) => {
    const newTree = req.body;

    try {
      const tree = fs.readFileSync('./tree.json').toString();
      if (treeCompatible(tree, newTree)) {
        const mergedTree = mergeTree(tree, newTree);
        fs.writeFileSync('./tree.json', JSON.stringify(mergedTree));
        res.json({success: true, tree: mergedTree});
      } else {
        res.json({success: false, tree: tree});
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    GET api/tree
// @desc     Get latest binary tree
// @access   Public
router.get(
  '/',
  async (req: any, res: any) => {
    try {
      const tree = fs.readFileSync('./tree.json').toString();
      res.json(tree);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);


const treeCompatible = (aTree, bTree) => {
  if (aTree.length === 0 || bTree.length === 0) {
    return true;
  }

  if (aTree[0] !== bTree[0]) {
    return false;
  }

  return treeCompatible(aTree[1], bTree[1]) && treeCompatible(aTree[2], bTree[2]);
}

const mergeTree = (aTree, bTree) => {
  if (aTree.length === 0) {
    return bTree;
  }

  if (bTree.length === 0) {
    return aTree;
  }

  return [aTree[0], mergeTree(aTree[1], bTree[1]), mergeTree(aTree[2], bTree[2])];
}

export default router;