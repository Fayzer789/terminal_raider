# Terminal Raider

A small browser game we built during a hackathon. A hacker has corrupted files on your system, and you have to solve little programming puzzles to repair them. But be careful: if you make too many mistakes, the hacker takes control of all your files.

**[Play it here](https://fayzer789.github.io/terminal_raider/fallout.html)**

![Terminal Raider gameplay](./images/terminal_raider_preview.png)

## What is it?

The theme of the hackathon was educational games, so we made something that teaches basic coding through a cybersecurity story.

You're sitting at a terminal. A hacker has corrupted some files on the system, and your job is to dig through the directories, find the damaged files, and repair them. Each repair is a short programming challenge.

Every wrong answer lowers your Integrity bar. When it reaches zero, you have no protection left and the hacker takes control of your files.

## How we built it

We were first-year cybersecurity students at the time, and honestly we had only done basic algorithms, and the only language we knew was C. We knew what we wanted the game to do, but not how to build a polished web game in a weekend.

So we used AI, and we're upfront about that:

- **Claude** helped us turn our game logic into JavaScript, HTML and CSS. We designed the mechanics and the structure, and it helped us write the code.
- **Gemini** generated the images and visual assets.

It was a good lesson in how far you can get by knowing what you want to build and being able to explain it clearly, even when you can't write all the code yourself yet.

## What's inside

- `fallout.html`: the entry point, open this to play
- `engine.js` and `config.js`: the game logic and the challenge settings
- `fallout.css`: all the styling

It's plain JavaScript with no frameworks and no build step.

## Run it locally

Clone the repository:

```bash
git clone https://github.com/fayzer789/terminal_raider.git
cd terminal_raider
```

Then start a local server from inside the project folder.

**Linux / macOS:**

```bash
python3 -m http.server 8000
```

**Windows:**

```bash
py -m http.server 8000
```

Then open this address in your web browser:

```
http://localhost:8000/fallout.html
```
