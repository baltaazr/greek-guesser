import express from "express";
import fs from "fs";

const router = express.Router();

// @route    POST api/tree
// @desc     Update tree
// @access   Public
router.post("/", async (req: any, res: any) => {
  const newTree = req.body;

  try {
    const tree = JSON.parse(fs.readFileSync("./server/data.json").toString());
    if (treeCompatible(tree, newTree)) {
      const mergedTree = mergeTree(tree, newTree);
      fs.writeFileSync("./server/data.json", JSON.stringify(mergedTree));
      console.log("Tree updated");
      const newNames = getLeafNodes(mergedTree);
      const originalNames = new Set(getLeafNodes(tree));
      const diffNames = newNames.filter((x) => !originalNames.has(x));
      console.log("Total names: ", newNames, newNames.length);
      console.log("New names: ", diffNames);
      res.json({ success: true, tree: mergedTree });
    } else {
      res.json({ success: false, tree: tree });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route    GET api/tree
// @desc     Get latest binary tree
// @access   Public
router.get("/", async (req: any, res: any) => {
  try {
    const tree = fs.readFileSync("./server/data.json").toString();
    res.json(tree);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

const treeCompatible = (aTree, bTree) => {
  if (
    aTree.length === 0 ||
    bTree.length === 0 ||
    aTree[1].length === 0 ||
    bTree[1].length === 0
  ) {
    return true;
  }

  if (aTree[0].toLowerCase() !== bTree[0].toLowerCase()) {
    return false;
  }

  return (
    treeCompatible(aTree[1], bTree[1]) && treeCompatible(aTree[2], bTree[2])
  );
};

const mergeTree = (aTree, bTree) => {
  if (aTree.length === 0 || aTree[1].length === 0) {
    return bTree;
  }

  if (bTree.length === 0 || bTree[1].length === 0) {
    return aTree;
  }

  return [
    aTree[0],
    mergeTree(aTree[1], bTree[1]),
    mergeTree(aTree[2], bTree[2]),
  ];
};

const getLeafNodes = (tree) => {
  if (tree.length === 0) {
    return [];
  }

  if (tree[1].length === 0 && tree[2].length === 0) {
    return [tree[0]];
  }

  return [...getLeafNodes(tree[1]), ...getLeafNodes(tree[2])];
};

export default router;
