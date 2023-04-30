import React, { useState, useEffect } from "react";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import axios from "axios";
import "react-notifications/lib/notifications.css";
import "./App.css";
import styled from "styled-components";

const Background = styled.div`
  /* The image used */
  background-image: url("https://i0.wp.com/hyperallergic-newspack.s3.amazonaws.com/uploads/2018/10/Athens-Acropolis-HOME.jpg");

  /* Add the blur effect */
  filter: blur(8px);
  -webkit-filter: blur(8px);

  /* Full height */
  height: 100%;

  /* Center and scale the image nicely */
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  transform: scale(1.1);
`;

const Container = styled.div`
  background-color: rgb(0, 0, 0); /* Fallback color */
  background-color: rgba(0, 0, 0, 0.4); /* Black w/opacity/see-through */
  color: white;
  font-weight: bold;
  border: 3px solid #f1f1f1;
  position: absolute;
  top: ${(props: { mobile: boolean }) => (props.mobile ? "60%" : "50%")};
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  width: 80%;
  max-width: 800px;
  padding: 20px;
  text-align: center;
`;

const Title = styled.div`
  position: absolute;
  top: 17%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  width: 80%;
  padding: 20px;
  text-align: center;
`;

const term = "person";

function App() {
  const [tree, setTree] = useState([]);
  const [current, setCurrent] = useState<any[]>([]);
  // Array of booleans, true means yes (left), false means no (no)
  const [path, setPath] = useState<boolean[]>([]);
  // Prompt new entry
  const [namePrompt, setNamePrompt] = useState<boolean>(false);
  const [diffPrompt, setDiffPrompt] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [diff, setDiff] = useState<string>("");

  axios.defaults.baseURL = "http://localhost:4000/api/tree";
  // axios.defaults.baseURL = "https://greek-guesser.herokuapp.com/api/tree";

  let mobile = false;
  if (window.innerHeight < 750) {
    mobile = true;
  }

  const checkTree: (tree: any[], name: string) => boolean = (tree, name) => {
    if (tree[0].toLowerCase() === name.toLowerCase()) {
      return true;
    }
    if (tree[1].length === 0) {
      return false;
    }
    return checkTree(tree[1], name) || checkTree(tree[2], name);
  };

  const updateTree: (
    tree: any[],
    name: string,
    diff: string,
    path: boolean[]
  ) => any[] = (tree, name, diff, path) => {
    if (path.length === 0) {
      return [diff, [name, [], []], [tree[0], [], []]];
    }

    const newTree = [...tree];

    if (path[0]) {
      newTree[1] = updateTree(tree[1], name, diff, path.slice(1));
    } else {
      newTree[2] = updateTree(tree[2], name, diff, path.slice(1));
    }

    return newTree;
  };

  const fetchTree = async () => {
    const result = await axios.get("/");
    const newTree = JSON.parse(result.data);
    setTree(newTree);
    return newTree;
  };

  const reset = async (tree?: any[], mute?: boolean) => {
    let newTree;
    if (tree) newTree = tree;
    else newTree = await fetchTree();

    if (!mute)
      NotificationManager.info(`Try another ${term}!`, "Game Restarted");

    setCurrent(newTree);
    setPath([]);
    setNamePrompt(false);
    setDiffPrompt(false);
    setName("");
    setDiff("");
  };

  const wrongGuess = async () => {
    setNamePrompt(true);
  };

  const submitName = async (tree?: any[]) => {
    let newTree;
    if (tree) newTree = tree;
    else newTree = await fetchTree();

    // If name already in tree, reset
    // else prompt for difference
    if (checkTree(newTree, name)) {
      NotificationManager.info("Your entry is already in", "");
      reset(newTree);
    } else {
      updateCurrent(path, newTree);
      setNamePrompt(false);
      setDiffPrompt(true);
    }
  };

  const submitDiff = async () => {
    const updatedTree = updateTree(tree, name, diff, path);
    const { data }: any = await axios.post("/", updatedTree);
    setTree(data.tree);
    if (data.success === true) {
      NotificationManager.success("New entry added", "Success!");
      reset(data.tree);
    } else {
      NotificationManager.info(
        "The tree was updated while you were playing, please answer these questions to add your entry",
        "Tree changes"
      );
      submitName(data.tree);
    }
  };

  const updateCurrent = (newPath: boolean[], newTree: any[]) => {
    let newCurrent = newTree;
    for (const p of newPath) {
      newCurrent = newCurrent[p ? 1 : 2];
    }
    setCurrent(newCurrent);
  };

  const update = async (yes: boolean) => {
    const newPath = [...path, yes];
    setPath(newPath);
    const newTree = await fetchTree();
    if (name.length !== 0 && checkTree(newTree, name)) {
      NotificationManager.info("Your entry is already in", "");
      reset(newTree);
    } else {
      updateCurrent(newPath, newTree);
    }
  };

  useEffect(() => {
    reset(undefined, true);
  }, []);

  let content;

  // Tree loading
  if (tree.length === 0 || current.length === 0) {
    content = <div>Loading...</div>;
  }

  // Prompt difference if leaf node
  else if (diffPrompt && current[1].length === 0) {
    content = (
      <Container mobile={mobile}>
        <h2>
          What is the difference between {current[0]} and {name}?
        </h2>
        <h2>{name} is ___</h2>
        <input
          type="text"
          value={diff}
          onChange={(event) => {
            setDiff(event.target.value);
          }}
          onKeyDown={async (event) => {
            if (event.key === "Enter") {
              await submitDiff();
            }
          }}
        />
        <button onClick={submitDiff}>Submit</button>
      </Container>
    );
  }

  // Prompt new entry
  else if (namePrompt) {
    content = (
      <Container mobile={mobile}>
        <h2>What is the {term} you were thinking of?</h2>
        <input
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          onKeyDown={async (event) => {
            if (event.key === "Enter") {
              await submitName();
            }
          }}
        />
        <button
          onClick={async () => {
            await submitName();
          }}
        >
          Submit
        </button>
      </Container>
    );
  }

  // Leaf, final answer
  else if (current[1].length === 0) {
    content = (
      <Container mobile={mobile}>
        <h2>
          Is your {term} {current[0]}?
        </h2>
        <button
          onClick={async () => {
            await reset();
          }}
        >
          Yes
        </button>
        <button onClick={wrongGuess}>No</button>
      </Container>
    );
  }

  // Internal node, continue asking
  else {
    content = (
      <Container mobile={mobile}>
        <h2>
          Is {name.length === 0 ? `your ${term}` : name} {current[0]}?
        </h2>
        <button
          onClick={async () => {
            await update(true);
          }}
        >
          Yes
        </button>
        <button
          onClick={async () => {
            await update(false);
          }}
        >
          No
        </button>
      </Container>
    );
  }

  return (
    <>
      <Background />
      <Title>
        <h1>The Ancient Greek Guessing Game</h1>
      </Title>
      {content}
      <NotificationContainer />
    </>
  );
}

export default App;
