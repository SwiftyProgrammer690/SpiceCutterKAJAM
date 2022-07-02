import kaboom from "kaboom"
import big from "./big"
import patrol from "./patrol"
import loadAssets from "./assets"

kaboom({
  font: 'apl386',
	background: [ 194, 26, 9 ]
})
loadAssets();


// define some constants
const JUMP_FORCE = 1320
const MOVE_SPEED = 480
const FALL_DEATH = 2400
const BULLET_SPEED = 800

function addButton(txt, p, f) {
  const btn = add([
    text(txt, {
      size: 25,
      transform(idx, ch) {
        return {
          color: hsl2rgb(0, 0, 255),
        }
      }
    }),
    pos(p),
    area({ cursor: "pointer", }),
  ])
  btn.onClick(f);
}

function spawnChilli() {
  const dir = choose([LEFT, RIGHT])

	add([
		sprite("bean", { flipX: dir.eq(LEFT) }),
    scale(2),
		move(dir, rand(40, 100)),
		cleanup(),
		pos(dir.eq(LEFT) ? width() : 0, rand(-20, 480)),
		origin("top"),
		area(),
		z(-50),
	])

	wait(rand(1, 3), spawnChilli)
}

function spawnEnemy() {
  const dir = choose([LEFT, RIGHT])

	add([
		sprite("ghosty", { flipX: dir.eq(LEFT) }),
    scale(2),
		move(dir, rand(40, 100)),
		cleanup(),
		pos(dir.eq(LEFT) ? width() : 0, rand(-20, 480)),
		origin("top"),
		area(),
		z(-50),
	])

	wait(rand(1, 3), spawnEnemy)
}

const LEVELS = [
	[
		"                          $",
		"                          $",
		"                          $",
		"                          $",
		"                      =   $",
		"           $$         =   $",
		"  %      ====         =   $",
		"                      =   $",
		"               =   >  =    ",
		"       ^^      =========  @",
		"===========================",
	],
	[
		"     $    $    $    $     $",
		"     $    $    $    $     $",
		"                           ",
		"                           ",
		"                           ",
		"                           ",
		"                           ",
		" ^^^^>^^^^>^^^^>^^^^>^^^^^@",
		"===========================",
	],
  [
		"                           ",
		"               =           ",
		"          ===  =           ",
		"               =           ",
		"               =           ",
		"     ===   $$  =           ",
		"  %            =           ",
		"        ===    =      =    ",
		"               =      =    ",
		"       ^^      = >    =   @",
		"===========================",
	],
  [
		"                          $",
		"                          $",
		"                          $",
		"                     =    $",
		"           $$        =| = $",
		"           ===        =   $",
		"  %     $$            =   $",
		"        ===           =   $",
		"                      =    ",
		"       ^^   |  |  |   =   @",
		"===========================",
	],
  [
		"                           ",
		"                     =     ",
		"                     =     ",
		"             = >> =  =     ",
		"              ====   =     ",
		"            ^^       =     ",
		"       $$$ ===       =     ",
		"       ===           =     ",
		"                     =     ",
		"          $$$$      == !|@=",
		"===========================",
	],
  [
		"                    | >>>  ",
		"                   =====   ",
		"             >>> =         ",
		"        ^^=======   =      ",
		"        ===         =      ",
		"     $$$            =      ",
		"     ===            = !   =",
		"     $$$            =     =",
		"     ===            =     =",
		"                    =    @=",
		"===========================",
  ],
]



// define what each symbol means in the level graph
const levelConf = {
	// grid size
	width: 64,
	height: 64,
	// define each object as a list of components
	"=": () => [
		sprite("grass"),
		area(),
		solid(),
		origin("bot"),
	],
	"$": () => [
		sprite("coin"),
		area(),
		pos(0, -9),
		origin("bot"),
		"coin",
	],
	"%": () => [
		sprite("prize"),
		area(),
		solid(),
		origin("bot"),
		"prize",
	],
	"^": () => [
		sprite("spike"),
		area(),
		solid(),
		origin("bot"),
		"danger",
	],
	"#": () => [
		sprite("apple"),
		area(),
		origin("bot"),
		body(),
		"apple",
	],
	">": () => [
		sprite("ghosty"),
		area(),
		origin("bot"),
		body(),
		patrol(),
		"enemy",
	],
	"@": () => [
		sprite("portal"),
		area({ scale: 0.5, }),
		origin("bot"),
		pos(0, -12),
		"portal",
	],
  "|": () => [
		sprite("cut"),
		area(),
		origin("bot"),
		body(),
		patrol(),
		"enemy",
	],
  "-": () => [
		sprite("trapdoor"),
		area(),
		solid(),
		origin("bot"),
	],
  "!": () => [
		sprite("key"),
		area(),
		origin("bot"),
		body(),
		patrol(),
		"enemy",
	],
}

scene("game", ({ levelId, coins } = { levelId: 0, coins: 0 }) => {

	gravity(3200)

	// add level to scene
	const level = addLevel(LEVELS[levelId ?? 0], levelConf)

	// define player object
	const player = add([
		sprite("bean"),
		pos(0, 0),
		area(),
		scale(1),
		// makes it fall to gravity and jumpable
		body(),
		// the custom component we defined above
		big(),
		origin("bot"),
	])

	// action() runs every frame
	player.onUpdate(() => {
		// center camera to player
		camPos(player.pos)
		// check fall death
		if (player.pos.y >= FALL_DEATH) {
			go("lose")
		}
	})

	// if player onCollide with any obj with "danger" tag, lose
	player.onCollide("danger", () => {
		go("lose")
		play("hit")
	})

	player.onCollide("portal", () => {
		play("portal")
		if (levelId + 1 < LEVELS.length) {
			go("game", {
				levelId: levelId + 1,
				coins: coins,
			})
		} else {
			go("win")
		}
	})

	player.onGround((l) => {
		if (l.is("enemy")) {
			player.jump(JUMP_FORCE * 1.5)
			destroy(l)
			addKaboom(player.pos)
			play("powerup")
		}
	})

	player.onCollide("enemy", (e, col) => {
		// if it's not from the top, die
		if (!col.isBottom()) {
      shake(120)
      wait(1, () => {
        go("lose")
      })
			
			play("hit")
		}
	})

  player.onCollide("key", (e, col) => {
		// if it's not from the top, die
		if (!col.isBottom()) {
      shake(120)
      wait(1, () => {
        go("lose")
      })
			
			play("hit")
		}
	})

  player.onCollide("cut", (e, col) => {
		// if it's not from the top, die
		if (!col.isBottom()) {
      shake(120)
      wait(1, () => {
        go("lose")
      })
			
			play("hit")
		}
	})

	let hasApple = false

	// grow an apple if player's head bumps into an obj with "prize" tag
	player.onHeadbutt((obj) => {
		if (obj.is("prize") && !hasApple) {
			const apple = level.spawn("#", obj.gridPos.sub(0, 1))
			apple.jump()
			hasApple = true
      shake(120)
			play("blip")
		}
	})

	// player grows big onCollide with an "apple" obj
	player.onCollide("apple", (a) => {
		destroy(a)
		// as we defined in the big() component
		player.biggify(3)
		hasApple = false
		play("powerup")
	})

	let coinPitch = 0

	onUpdate(() => {
		if (coinPitch > 0) {
			coinPitch = Math.max(0, coinPitch - dt() * 100)
		}
	})

	player.onCollide("coin", (c) => {
		destroy(c)
		play("coin", {
			detune: coinPitch,
		})
		coinPitch += 100
		coins += 1
		coinsLabel.text = coins
	})

	const coinsLabel = add([
		text(coins),
		pos(24, 24),
		fixed(),
	])

	// jump with space
	onKeyPress("space", () => {
		// these 2 functions are provided by body() component
		if (player.isGrounded()) {
			player.jump(JUMP_FORCE)
		}
	})

	onKeyDown("left", () => {
		player.move(-MOVE_SPEED, 0)
	})

	onKeyDown("right", () => {
		player.move(MOVE_SPEED, 0)
	})

	onKeyPress("down", () => {
		player.weight = 3
	})

	onKeyRelease("down", () => {
		player.weight = 1
	})

	onKeyPress("f", () => {
		fullscreen(!fullscreen())
	})

})

scene("lose", () => {
  spawnChilli()
  spawnEnemy()
  add([
  pos(center()),
  origin("center"),
  text("You Lost!"),
    
  ])
  addButton(
   "Try Again?", 
   vec2(300, 450), 
   () => go("game"))
})


loadSound("music", "sounds/music.mp3");

scene("intro", () => {
  spawnChilli()
  spawnEnemy()
  let music = play("music", {
    volume: 1,
    loop: true
  })
  add([
    pos(center()),
    origin("center"),
    text("Spice Cutter"),
    
  ])
  add([
    pos(center()),
    origin("center"),
    text("\n\n\n\n\n\ndon't get cut by the enemy knifes!", {
      size: 25
    }),
  ])
  addButton(
    "Play", 
    vec2(300, 450), 
    () => go("game")),
  addButton("Instructions", vec2(300, 500), () => go("instructions"))
  
})

scene("win", () => {
  spawnChilli()
  spawnEnemy()
  add([
    pos(center()),
    origin("center"),
    text("You Won!"),
    
  ])
  addButton(
   "Play Again!", 
   vec2(300, 450), 
   () => go("game"))
})

scene("instructions", () => {
  spawnChilli()
  spawnEnemy()
  add([
    pos(center()),
    origin("center"),
    text("Instructions\n\n\nTry to weave your way around \nthis platformer!. There are \nenemies, so be careful! Use your arrow keys \nto move the player. Remember that the \nUP key and DOWN key don't work! \n(JUMP: [SPACE]\nGood luck and have fun! :D", {
      size: 35
    })
  ])
  addButton("Go Play!", vec2(200, 600), () => go("game"))  
})

go("intro")
