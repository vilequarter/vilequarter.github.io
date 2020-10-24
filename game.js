var player = {
    influence: 1, //measured in square inches?

    totalEssence: 0,
    essenceTypes: [
        0,  //earth
        0,  //fire
        0,  //water
        0,  //air
        0,  //celestial
        0   //infernal
    ],

    maxEssence: 50,
    greatestEssence: 0,

    totalCorruption: 0,
    corruptionTypes: [
        0,  //earth
        0,  //fire
        0,  //water
        0,  //air
        0,  //celestial
        0   //infernal
    ],
    // multiplied by essence received to determine amount of corruption received
    corruptionReceived: 0.75,

    rank: 0,
    refining: false,
    refineRate: 0.05,
    maxEssenceRefineIncrease: 1,

    drawing: null,
    drawRate: 0.001,

    increaseInfluence: false,
    increaseInfluenceRate: 0.5,
}

var ELEMENTS = ["Earth", "Fire", "Water", "Air", "Celestial", "Infernal"];

var ELEMENT_COLORS = [
    [165, 42, 42], //earth, brown
    [255, 0, 0], //fire, red
    [0, 0, 255], //water, blue
    [0, 128, 0], //air, green
    [255, 215, 0], //celestial, gold
    [148, 0, 211], //infernal, darkviolet
]

var RANKS = ["G", "F", "E", "D", "C", "B", "A", "S", "SS", "SSS", "Heavenly", "Godly"];
//subject to change/balance:
var RANK_THRESHOLDS = [1, 1e11, 1e22, 1e33, 1e44, 1e55, 1e66, 1e77, 1e88, 1e99, 1e110, 1e121]; 

var areaOfInfluence = {
    mushrooms: 1,
    airVolume: 1,
    waterArea: 0,
}

var flags = {
    findMoreMushrooms: false,
    mushroomsFoundAgain: false,
    searchCost: false,
    tastyMushrooms: false,
    feelingFull: false,
    completelyFull: false,
    wastedMushrooms: 0,
    wispApproach: false,
    runWispMessage: null,
    wispLineNumber: 0,
    beginRefining: false,
    doneRefining: false,
    essenceTypesKnown: false,
    influenceKnown: false,
    waterFound: false,
    exactMeasurementsKnown: false
}

var allUpgrades = [];
var unlockedUpgrades = [];

// Upgrade constructor
function Upgrade(type, name, desc, flavorText, essCost, corrCost, id){
    var $upgradeTab = $("#upgradeTab");
    this.type = type;
    this.name = name;
    this.description = desc;
    this.flavorText = flavorText;
    this.essCost = essCost;
    this.corrCost = corrCost;
    this.id = document.getElementById(id);
    this.unlocked = false;
    this.purchased = false;
    this.activateEffect = null;
    this.unlockConditions = null;
    this.unlockEffects = null;
    this.buy = function(){
        if(canAfford(this.essCost, this.corrCost)){
            removeEssence(this.essCost);
            this.activateEffect();
            this.purchased = true;
            this.$button.remove();
            updateStats();
        }
    }
    this.unlock = function(){
        if(!this.unlocked){
            this.$button.css("display", "inline-block");
            this.unlocked = true;
            unlockedUpgrades.push(this);
            if(this.unlockEffects != null){
                this.unlockEffects();
            }
        }
    }

    this.$button = $("<button/>");
    this.$button
        .css("display", "none")
        .attr("onclick", id + ".buy()")
        .addClass("upgradeButton cannotAfford");
    this.$title = $("<p></p>");
    this.$title
        .text(this.name)
        .addClass("upgradeTitle");
    this.$description = $("<p></p>");
    this.$description
        .text(this.description)
        .addClass("upgradeDescription");
    this.$cost = null;
    if(flags.exactMeasurementsKnown){
        this.$cost = $("<p></p>");
        this.$cost
            .text(costString(this.essCost, this.corrCost))
            .addClass("upgradeCost");
    }
    this.$flavorText = $("<p></p>");
    this.$flavorText
        .text(this.flavorText)
        .addClass("flavorText");

    this.$button.append(this.$title, this.$description, this.$cost, this.$flavorText);
    
    $upgradeTab.append(this.$button);
    
    this.checkAffordability = function(){
        if(canAfford(this.essCost, this.corrCost)){
            this.$button.addClass("canAfford");
            this.$button.removeClass("cannotAfford");
        }
        else{
            this.$button.addClass("cannotAfford");
            this.$button.removeClass("canAfford");
        }
    }

    allUpgrades.push(this);
}

// *** UPGRADES ***
//Refine upgrades
var refineUpgrade0 = new Upgrade("refine", "Better Refining", "Use some Essence to double the rate of Essence refinement", "It's like a Brita filter, but for Essence", 5, 0, "refineUpgrade0");
refineUpgrade0.activateEffect = function(){ player.refineRate *= 2 };
refineUpgrade0.unlockConditions = function() {return (!flags.slowRefining && player.maxEssence >= 53.5)};
refineUpgrade0.unlockEffects = function() {
    addNewMessage("I think I'm starting to get a hang of this refining thing. I think I can make it faster if I just nudge some of the Essence like this...", "selfMessage");
    $("#upgradeTab").css("display", "table");
}

var refineUpgrade1 = new Upgrade("refine", "Forced Refining", "Make some Essence blast out the Corruption, tripling the rate of Essence refinement", "Like blowing a golf ball through a garden hose", 15, 0, "refineUpgrade1");
refineUpgrade1.activateEffect = function(){ player.refineRate *= 3 };
refineUpgrade1.unlockConditions = function(){ return (refineUpgrade0.purchased && player.maxEssence >= 57)};
refineUpgrade1.unlockEffects = function() {
    addNewMessage("Alright, refining is getting boring. Let's get this over with.", "selfMessage");
}

var refineUpgrade2 = new Upgrade("refine", "Windy Refining", "Use a little Air Essence to spin your Center at high speeds, tripling the rate of Essence refinement", "You know those videos where they blow pressurised air on a wheel? Yeah, like that", [0, 0, 0, 3, 0, 0], 0, "refineUpgrade2");
refineUpgrade2.activateEffect = function(){ player.refineRate *= 3 };
refineUpgrade2.unlockConditions = function(){ return (refineUpgrade1.purchased && player.maxEssence >= 100 && player.essenceTypes[3] >= 1)};
refineUpgrade2.unlockEffects = function(){ addNewMessage("Time to put this newfangled Air Essence to good use.", "selfMessage")};

var refineUpgrade3 = new Upgrade("refine", "Efficient Refining", "Compact your Essence further when refining", "Getting the most out of every drop", 25, 0, "refineUpgrade3");
refineUpgrade3.activateEffect = function(){ player.maxEssenceRefineIncrease *= 2};
refineUpgrade3.unlockConditions = function(){ return corruptionUpgrade0.purchased;};

//Corruption upgrades
var corruptionUpgrade0 = new Upgrade("corruption", "Selective Munching", "You're able to eat around the Corruption a little bit better when pulling it out of stuff", "I just avoid the moldy bits, it's fine", 30, 0, "corruptionUpgrade0");
corruptionUpgrade0.activateEffect = function(){ player.corruptionReceived = round(player.corruptionReceived * 0.75); refineUpgrade3.unlock();};
corruptionUpgrade0.unlockConditions = function(){ return(player.maxEssence >= 80)};
corruptionUpgrade0.unlockEffects = function(){ addNewMessage("I'm getting better at recognizing the Corruption within the Essence out there.", "selfMessage");}

//Influence upgrades
var influenceUpgrade0 = new Upgrade("influence", "Concentrated Expansion", "Unlock the ability to focus on expanding your Influence over time. You can only concentrate on one action (refining/drawing/expanding) at a time", "It's like my mind is swelling to fill the universe", 40, 0, "influenceUpgrade0");
influenceUpgrade0.activateEffect = function(){$("#searchButton").attr("onclick","toggleIncreaseInfluence()");};
influenceUpgrade0.unlockConditions = function(){ return (player.influence >= 40)};
influenceUpgrade0.unlockEffects = function(){ addNewMessage("What if I use the Essence's natural tendency to push outward in order to expand my Influence?", "selfMessage");}

//Draw upgrades
var drawUpgrade0 = new Upgrade("draw", "Better Draw", "Multiply the base rate of drawing from natural sources by ten", "Go fish", 25, 0, "drawUpgrade0");
drawUpgrade0.activateEffect = function(){ player.drawRate *= 10;};
drawUpgrade0.unlockConditions = function(){ return (player.essenceTypes[2] + player.essenceTypes[3] >= 10);}; 

//Misc upgrades
var eatMultipleUpgrade = new Upgrade("misc", "Eat Multiple Mushrooms", "Spread your awareness to be able to consume multiple mushrooms at once", "I've got a big mouth", 25, 0, "eatMultipleUpgrade");
eatMultipleUpgrade.activateEffect = function(){ 
    $("#eatMultiple").css("display", "inline-block");
    $("#eat10percent").css("display", "inline-block");
    $("#eat25percent").css("display", "inline-block");
    $("#eat50percent").css("display", "inline-block");
    $("#eatAll").css("display", "inline-block");
};
eatMultipleUpgrade.unlockConditions = function(){ return (player.maxEssence >= 150);};
eatMultipleUpgrade.unlockEffects = function(){ addNewMessage("You know what, I bet I could pull the Essence from all these mushrooms at once if I concentrated...", "selfMessage");};

// function round(value)
// simple function that rounds an input number to 3 decimal points
// used to keep precision and to avoid converting to a string as toFixed does
function round(value){
    return Math.round(value * 1e3) / 1e3;
}

// function costString(essenceCost, corruptionCost)
// accepts two arrays of six numerical values each, corresponding to ELEMENTS
// returns a readable string displaying the elemental costs, omitting any zero values
// used for upgrade text and similar displays
function costString(essenceCost, corruptionCost){
    var output = "Cost: ";

    if(Array.isArray(essenceCost)){
        for (var i = 0; i < ELEMENTS.length; i++){
            if(essenceCost[i] == 0){
                continue;
            }
            output += essenceCost[i] + " " + ELEMENTS[i] + " Essence, ";
        }
    }
    else{
        output += essenceCost + " Essence, ";
    }
    if(Array.isArray(corruptionCost)){
        for(var i = 0; i < ELEMENTS.length; i++){
            if(corruptionCost[i] == 0){
                continue;
            }
            output += corruptionCost[i] + " " + ELEMENTS[i] + " Corruption, ";
        }
    }
    else{
        output += corruptionCost + " Corruption, ";
    }
    output = output.substring(0, output.length - 2);
    return output;
}

// function canAfford(essenceCost, corruptionCost)
// accepts two arrays of six numerical values each, corresponding to ELEMENTS, for both essence and corruption costs
// checks the costs against player.essenceTypes and player.corruptionTypes
// returns true only if all player values are equal to or higher than the costs, false otherwise
function canAfford(essenceCost, corruptionCost){
    if(Array.isArray(essenceCost)){
        for(var i = 0; i < ELEMENTS.length; i++){
            if(essenceCost[i] > player.essenceTypes[i]){
                return false;
            }
        }
    }
    else{
        if(essenceCost > player.totalEssence){
            return false;
        }
    }
    if(Array.isArray(corruptionCost)){
        for(var i = 0; i < ELEMENTS.length; i++){
            if(corruptionCost[i] > player.corruptionTypes[i]){
                return false;
            }
        }
    }
    else{
        if(corruptionCost > player.totalCorruption){
            return false;
        }
    }
    return true;
}

// function contextAction(stage)
// accepts a string corresponding to a certain stage of context action
// executes certain actions depending on the stage, usually including calls to addNewMessage and changing button functions and display
// will likely eventually be refactored along with wispConversation, wispConversationStart, and triggerFlag to be less ugly
function contextAction(stage){
    var button = $("#contextButton");

    switch(stage){
        case 'Wake Up': //Look around
        addNewMessage("I notice a small mushroom nearby. It seems to glow with some kind of energy. Energy that I really want.", "selfMessage");
        button.text("Eat mushroom");
        button.attr("onclick", "contextAction('Eat mushroom')");
        break;

        case 'Eat mushroom': //Eat mushroom
        eatMushroom();
        addNewMessage("I feel slightly stronger. Maybe there's more of those mushrooms around?", "selfMessage");
        button.text("Look around some more");
        button.attr("onclick", "contextAction('Look around')");
        break;

        case 'Look around': //Look around some more
        increaseInfluence(1);
        addNewMessage("Oooo, a few more mushrooms!", "selfMessage");
        button.css("display", "none");
        $("#eatMushroom").css("display", "inline-block");
        $("#eatMushroom").text("Eat mushroom (" + areaOfInfluence.mushrooms + ")");
        break;

        case 'No more mushrooms': //Ran out of mushrooms
        addNewMessage("I'm out of mushrooms. I should really try to search more of my surroundings.", "selfMessage");
        $("#searchButton").css("display", "inline-block");
        break;

        case 'Mushrooms found again':
        addNewMessage("Ah, there we go. Just gotta keep expanding my vision, that's all.", "selfMessage");
        break;

        case 'Tasty mushrooms': //tasty mushroom message update
        addNewMessage("Man, mushrooms are tasty. Probably the tastiest thing I've ever eaten. Wait, have I even eaten anything other than these mushrooms?", "selfMessage");
        break;

        case 'Search cost':
        addNewMessage("Hm, it looks like it takes a bit of that energy to push my senses further. Better be careful about that.", "selfMessage");
        break;

        case 'Feeling full':
        addNewMessage("Hmmm, feeling kinda full. Should I slow down on this mushroom consumption? ... Nah.", "selfMessage");
        break;

        case 'Completely full':
        addNewMessage("That last mushroom didn't seem to do anything for me. Meh, must've just been a lame mushroom. These others should be fine.", "selfMessage");
        break;

        case 'Wisp approach':
        addNewMessage("Stop! *huff huff* You're going to kill yourself! You can't handle any more Essence!", "wispMessage");
        button.text("Uh... what? Who are you? Don't touch my mushrooms!");
        button.css("display", "inline-block");
        button.attr("onclick", "wispConversationStart()");
        break;

        case 'Begin Refining':
        addNewMessage("There you go! See how your Essence is starting to clear up? It's slow going, but you'll be all clean soon enough!", "wispMessage");
        flags.runWispMessage = setInterval(wispConversation, 5000);
        break;

        case 'Slow Refining':
        addNewMessage("I think I'm starting to get a hang of this refining thing. I think I can make it faster if I just nudge some of the Essence like this...", "selfMessage");
        $("#upgradeTab").css("display", "table");
        refineUpgrade0.unlock();
        break;

        case 'Done Refining':
        addNewMessage("Oh, done already? That was faster than I expected, nice work!", "wispMessage");
        flags.runWispMessage = setInterval(wispConversation, 5000);
        break;

        case 'Can draw air':
        flags.runWispMessage = setInterval(wispConversation, 5000);
        break;

        case 'Water found':
        flags.runWispMessage = setInterval(wispConversation, 5000);
        $("#draw_water").css("display", "block");
        break;

    }
}

// function increaseInfluence(amount)
// accepts a number value of how much influence to add
// if player.totalEssence does not cover the influence cost (1:1), returns false
// otherwise, subtracts the cost from player.essenceTypes in order of ELEMENTS, moving to the next element only if the element before it did not have enough to cover the entire cost
// then increases player.influence and adds the necessary amount of mushrooms to areaOfInfluence.mushrooms and returns true
function increaseInfluence(amount){
    if(player.totalEssence < amount){
        return false;
    }

    removeEssence(amount);
    player.influence += amount;
    if(!flags.wispApproach){
        areaOfInfluence.mushrooms += player.influence + 1;
    }
    else{
        areaOfInfluence.mushrooms += Math.floor((Math.floor(Math.random() * 5)) + (1 * amount));
        if(player.influence >= 100){
            areaOfInfluence.waterArea += round(amount * 0.1);
        }
    }
    $("#eatMushroom").text("Eat mushroom (" + areaOfInfluence.mushrooms + ")");
    updateStats();

    if(!flags.searchCost && player.influence >= 5){
        triggerFlag("searchCost");
    }

    return true;
}

// addEssence(amounts)
// accepts array of six number values, in order of ELEMENTS
// will attempt to add values to player's essenceTypes
// adds amounts in order of ELEMENTS, until player's current cap is reached or all values were added
// will also call addCorruption function if player cannot auto-refine, passing values based on essence added
// returns false if no essence was added due to player at current cap, or if current corruption >= current essence
// returns true if any essence was added, whether or not any was wasted
function addEssence(amounts){
    if(player.totalCorruption > 0 && player.totalCorruption >= player.totalEssence && flags.wispApproach){
        if(flags.wispLineNumber >= 20){
            addNewMessage("Looks like I've got too much Corruption, I'd better refine it out.","selfMessage");
        }
        if(player.drawing != null){
            toggleDraw(player.drawing);
        }
        return false;
    }

    if(player.totalEssence == player.maxEssence){
        if(!flags.completelyFull){
            triggerFlag("completelyFull");
        }
        if(player.drawing != null){
            toggleDraw(player.drawing);
        }
        return false;
    }

    // only used until player can auto-refine
    var corruptionToAdd = [];

    var remainingEssence = player.maxEssence - player.totalEssence;
    for(var i = 0; i < ELEMENTS.length; i++){
        if(amounts[i] > remainingEssence){
            player.essenceTypes[i] += remainingEssence;
            player.essenceTypes[i] = round(player.essenceTypes[i]);

            if(!player.canRefine){
                corruptionToAdd.push(remainingEssence);
                while(corruptionToAdd.length < ELEMENTS.length){
                    corruptionToAdd.push(0);
                }
                addCorruption(corruptionToAdd);
            }

            return true;
        }
        else{
            player.essenceTypes[i] += amounts[i];
            if(!player.canRefine){
                corruptionToAdd.push(amounts[i])
            }
        }
        updateStats();
    }

    if(!player.canRefine){
        addCorruption(corruptionToAdd);
    }

    return true;
}

// addCorruption(amounts)
// accepts array of six number values, in order of ELEMENTS
// multiplies incoming values by player's corruptionReceived modifier and adds the result to the respective corruption
function addCorruption(amounts){
    for(var i = 0; i < ELEMENTS.length; i++){
        player.corruptionTypes[i] = (player.corruptionTypes[i] * 1.0) + (amounts[i] * player.corruptionReceived);
        round(player.corruptionTypes[i]);
        player.corruptionTypes[i] = round(player.corruptionTypes[i]);
    }

    updateStats();
}

// function removeCorruption(value)
// general-purpose function, used to differentiate between removing specific elemental corruption or just removing an amount randomly
// calls removeSpecificCorruption if value is an array, calls removeRandomCorruption otherwise
function removeCorruption(value){
    if(Array.isArray(value)){
        return removeSpecificCorruption(value);
    }
    else{
        return removeRandomCorruption(value);
    }
}

// removeCorruption(amounts)
// accepts array of six number values, in order of ELEMENTS
// will remove passed value from the respective value of player.corruptionTypes
// removes down to zero, and does not check if player can meet the amount required
// use canAfford(essenceCost, corruptionCost) to validate, if necessary
// returns the total amount removed from corruption, in an array corresponding to element
function removeSpecificCorruption(amounts){
    var amountRemoved = [];
    for(var i = 0; i < ELEMENTS.length; i++){
        if(player.corruptionTypes[i] < amounts[i]){
            amountRemoved.push(amounts[i]);
        }
        else{
            amountRemoved.push(player.corruptionTypes[i]);
        }

        player.corruptionTypes[i] -= amounts[i];
        player.corruptionTypes[i] = round(player.corruptionTypes[i]);
        if(player.corruptionTypes[i] < 0){
            player.corruptionTypes = 0;
        }
    }
    updateStats();
    return amountRemoved;
}

// removeCorruption(value)
// accepts single number value
// attempts to remove value from a random value of player.corruptionTypes
// if selected value of player.corruptionTypes is not sufficient, it will continue to select values until value is depleted or all player.corruptionTypes == 0
// returns the total amount removed from corruption
function removeRandomCorruption(value){
    var order = getRandomArray(ELEMENTS.length);

    var toRemove = value;
    var amountRemoved = 0;
    while(toRemove > 0){
        // all elements have been tried, all are now 0
        if(order.length == 0){
            return amountRemoved;
        }
        var index = order[0]
        // element is not enough to cover remaining removal value, remove all possible and try next element
        if(toRemove > player.corruptionTypes[index]){
            amountRemoved += player.corruptionTypes[index];
            toRemove -= player.corruptionTypes[index];
            player.corruptionTypes[index] = 0;
            order.shift();
        }
        // element can cover all remaining value
        else{
            amountRemoved += toRemove;
            player.corruptionTypes[index] -= toRemove;
            player.corruptionTypes[index] = round(player.corruptionTypes[index]);
            return amountRemoved;
        }
    }
    return amountRemoved;
}

// function removeEssence(value)
// general-purpose function, used to differentiate between removing specific elemental essence or just removing an amount randomly
// calls removeSpecificEssence if value is an array, calls removeRandomEssence otherwise
function removeEssence(value){
    if(Array.isArray(value)){
        return removeSpecificEssence(value);
    }
    else{
        return removeRandomEssence(value);
    }
}

// removeSpecificEssence(amounts)
// accepts array of six number values, in order of ELEMENTS
// will remove passed value from the respective value of player.essenceTypes
// removes down to zero, and does not check if the player can meet the amount required
// use canAfford(essenceCost, corruptionCost) to validate, if necessary
// returns total amount removed from essence, in array corresponding to elements
function removeSpecificEssence(amounts){
    var amountRemoved = [];
    for(var i = 0; i < ELEMENTS.length; i++){
        if(player.essenceTypes[i] < amounts[i]){
            amountRemoved.push(amounts[i]);
        }
        else{
            amountRemoved.push(player.essenceTypes[i]);
        }

        player.essenceTypes[i] -= amounts[i];
        player.essenceTypes[i] = round(player.essenceTypes[i]);
        if(player.essenceTypes[i] < 0){
            player.essenceTypes[i] = 0;
        }
    }
    updateStats();
    return amountRemoved;
}

// removeRandomEssence(value)
// accepts single number value
// attempts to remove value from a random value of player.essenceTypes
// if selected value of player.essenceTypes is not sufficient, it will continue to select values until value is depleted or all player.essenceTypes == 0
// returns total amount removed from essence
function removeRandomEssence(value){
    var order = getRandomArray(ELEMENTS.length);

    var toRemove = value;
    var amountRemoved = 0;
    while(toRemove > 0){
        // all elements have been tried, all are now 0
        if(order.length == 0){
            return amountRemoved;
        }
        var index = order[0]
        // element is not enough to cover remaining removal value, remove all possible and try next element
        if(toRemove > player.essenceTypes[index]){
            amountRemoved += player.corruptionTypes[index];
            toRemove -= player.essenceTypes[index];
            player.essenceTypes[index] = 0;
            order.shift();
        }
        // element can cover all remaining value
        else{
            amountRemoved += toRemove;
            player.essenceTypes[index] -= toRemove;
            player.essenceTypes[index] = round(player.essenceTypes[index]);
            return amountRemoved;
        }
    }
    return amountRemoved;
}

// function getRandomArray(size)
// accepts a number value, indicating the size of the array required
// generates and returns an array of values from 0 to (size - 1), in a random order
function getRandomArray(size){
    var arr = [];
    for(var i = 0; i < size; i++){
        arr.push([i]);
    }

    // found: https://stackoverflow.com/questions/5836833/create-a-array-with-random-values-in-javascript
    var tmp, current, top = arr.length;
    if(top) while(--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = arr[current];
        arr[current] = arr[top];
        arr[top] = tmp;
    }
    return arr;
}

// function updateStats()
// called every game tick and anytime displayed stats are updated in other functions
// calculates totals and updates display
function updateStats(){
    var totalEss = 0;
    var totalCorr = 0;
    for(var i = 0; i < ELEMENTS.length; i++){
        player.essenceTypes[i] = round(player.essenceTypes[i]);
        player.corruptionTypes[i] = round(player.corruptionTypes[i]);
        totalEss += (player.essenceTypes[i] * 1.0);
        totalCorr += (player.corruptionTypes[i] * 1.0);
    }
    player.totalEssence = round(totalEss);
    player.totalCorruption = round(totalCorr);

    if(player.totalEssence > player.greatestEssence){
        player.greatestEssence = player.totalEssence;
    }

    //numbers
    $("#influence").text(player.influence);
    $("#totalEssence").text(player.totalEssence);
    $("#maxEssence").text(player.maxEssence);
    $("#earthEssence").text(player.essenceTypes[0]);
    $("#fireEssence").text(player.essenceTypes[1]);
    $("#waterEssence").text(player.essenceTypes[2]);
    $("#airEssence").text(player.essenceTypes[3]);
    $("#celestialEssence").text(player.essenceTypes[4]);
    $("#infernalEssence").text(player.essenceTypes[5]);
    $("#totalCorruption").text(player.totalCorruption);
    $("#earthCorruption").text(player.corruptionTypes[0]);
    $("#fireCorruption").text(player.corruptionTypes[1]);
    $("#waterCorruption").text(player.corruptionTypes[2]);
    $("#airCorruption").text(player.corruptionTypes[3]);
    $("#celestialCorruption").text(player.corruptionTypes[4]);
    $("#infernalEssence").text(player.corruptionTypes[5]);

    //use generic bar until essence types are known
    if(!flags.essenceTypesKnown){
        var newWidth = round(player.totalEssence / player.maxEssence * 100) + "%";
        $("#generalBar").css("width", newWidth);
        var R = 128;
        var G = 212;
        var B = 255;
        var corruptionRatio = 1 - ((player.totalCorruption * 1.0) / player.totalEssence);
        R *= corruptionRatio;
        G *= corruptionRatio;
        B *= corruptionRatio;
        var newColor = "rgb(" + R + ", " + G + ", " + B + ")";
        $("#generalBar").css("backgroundColor", newColor);
    }
    else{
        if(!player.canRefine){
            var corruptionRatio = 1 - ((player.totalCorruption * 1.0) / player.totalEssence);
            var elementHTML = ["#earthBar", "#fireBar", "#waterBar", "#airBar", "#celestialBar", "#infernalBar"];

            for(var i = 0; i < ELEMENTS.length; i++){
                var newColor = "rgb(" + (ELEMENT_COLORS[i][0] * corruptionRatio) + ", " + (ELEMENT_COLORS[i][1] * corruptionRatio) + ", " + (ELEMENT_COLORS[i][2] * corruptionRatio) + ")";
                $(elementHTML[i]).css("backgroundColor", newColor);
            }
        }

        //progress bar
        var earthPercent = round(player.essenceTypes[0] / player.maxEssence * 100);
        var firePercent = round(player.essenceTypes[1] / player.maxEssence * 100);
        var waterPercent = round(player.essenceTypes[2] / player.maxEssence * 100);
        var airPercent = round(player.essenceTypes[3] / player.maxEssence * 100);
        var celestialPercent = round(player.essenceTypes[4] / player.maxEssence * 100);
        var infernalPercent = round(player.essenceTypes[5] / player.maxEssence * 100);

        $("#earthBar").css("width", earthPercent + "%");
        $("#fireBar").css("width", firePercent + "%");
        $("#waterBar").css("width", waterPercent + "%");
        $("#airBar").css("width", airPercent + "%");
        $("#celestialBar").css("width", celestialPercent + "%");
        $("#infernalBar").css("width", infernalPercent + "%");
    }

    //influence visual

}

// function eatMushroom()
// currently only used in the very early game
// called when button $("#eatMushroom") is clicked
// attempts to subtract one mushroom from areaOfInfluence
// if successful, adds mushroom essence value to player.essenceTypes (currently 1 earth), and updates button
function eatMushroom(){
    if(areaOfInfluence.mushrooms < 1){
        return;
    }
    if(!addEssence([1, 0, 0, 0, 0, 0])){
        flags.wastedMushrooms++;
        if(!flags.wispApproach && flags.wastedMushrooms >= 10){
            triggerFlag("wispApproach");
        }
    }
    areaOfInfluence.mushrooms -= 1;
    $("#eatMushroom").text("Eat mushroom (" + areaOfInfluence.mushrooms + ")");
}

// function eatMultiple(amount)
// if enough mushrooms are available, calls eatMushroom as many times as is specified by amount
function eatMultiple(amount){
    if(amount > areaOfInfluence.mushrooms){
        return false;
    }
    if(player.totalCorruption >= player.totalEssence){
        if(!confirm("Your Corruption is too high, so you won't gain any Essence from eating these. Eat anyway?")){
            return false;
        }
    }
    for(var i = 0; i < amount; i++){
        eatMushroom();
    }
}

// function wispConversationStart()
// begins the conversation with the wisp, updating the appropriate buttons and messages
// sets the flags.runWispMessage interval to call wispConversation()
// will likely eventually be refactored along with wispConversation, triggerFlag, and contextAction to be less ugly
function wispConversationStart(){
    addNewMessage("Uh... what? Who are you? Don't touch my mushrooms!", "selfMessage");

    $("#contextButton").css("display", "none");
    addNewMessage("I'm a Wisp! And I don't want your mushrooms, calm down!", "wispMessage");

    flags.runWispMessage = setInterval(wispConversation, 5000);   
}

// function wispConversation()
// runs through current tutorial with the wisp, updating buttons, messages, and flags accordingly
function wispConversation(){
    wisp[flags.wispLineNumber]();
    flags.wispLineNumber++;
}

// function toggleRefine()
// called when $("#refine") button is clicked
// toggles player.refining and updates the button accordingly
function toggleRefine(){
    if(player.refining){
        player.refining = false;
        $("#refineButton").text("Refine Essence");
        return;
    }
    $("#refineButton").text("Stop refining");
    player.refining = true;
    if(player.drawing != null){
        toggleDraw(player.drawing);
    }
    if(player.increasingInfluence){
        toggleIncreaseInfluence();
    }
}

// function toggleDraw(resource)
// toggles the drawing status, turning off any other toggleable statuses if it is turning on
function toggleDraw(resource){
    // already drawing
    if(player.drawing != null){
        // turning off current draw
        if(player.drawing == resource){
            player.drawing = null;
            $("#draw_" + resource).text("Draw from " + resource);
        }
        // switching to different draw
        else{
            $("#draw_" + player.drawing).text("Draw from " + player.drawing);
            player.drawing = resource;
            $("#draw_ " + resource).text("Stop drawing");
        }
    }
    // not currently drawing
    else{
        $("#draw_" + resource).text("Stop drawing");
        player.drawing = resource;
        if(player.refining){
            toggleRefine();
        }
        if(player.increasingInfluence){
            toggleIncreaseInfluence();
        }
    }
}

// function toggleIncreaseInfluence()
// turns on or off player.increasingInfluence
// turns off any other concentrating actions (draw/refine) if turning on
function toggleIncreaseInfluence(){
    if(player.increasingInfluence){
        player.increasingInfluence = false;
        $("#searchButton").text("Increase Influence");
    }
    else{
        player.increasingInfluence = true;
        $("#searchButton").text("Stop increasing Influence");
        if(player.drawing != null){
            toggleDraw(player.drawing);
        }
        if(player.refining){
            toggleRefine();
        }
    }
}

// function draw(resource)
// generates essence based on the value of player.drawing
// will only be called by gameLoop if player.drawing != null
function draw(){
    switch(player.drawing){
        case 'air':
        if(!flags.canDrawAir && player.essenceTypes[3] >= 0.1){
            triggerFlag("canDrawAir");
        }
        addEssence([0, 0, 0, player.drawRate * player.influence, 0, 0]);
        break;

        case 'water':
        addEssence([0, 0, player.drawRate * areaOfInfluence.waterArea, 0, 0, 0]);
        break;
    }
}

// function triggerFlag(flag)
// accepts a string matching a predetermined list, and calls contextAction(stage) based on input
// will likely eventually be refactored along with wispConversationStart, wispConversation, and contextAction to be less ugly
function triggerFlag(flag){
    switch(flag){
        case "findMoreMushrooms":
        flags.findMoreMushrooms = true;
        contextAction('No more mushrooms');
        break;

        case "mushroomsFoundAgain":
        flags.mushroomsFoundAgain = true;
        contextAction('Mushrooms found again');
        break;

        case "searchCost":
        flags.searchCost = true;
        contextAction('Search cost');
        break;
        
        case "tastyMushrooms":
        flags.tastyMushrooms = true;
        contextAction('Tasty mushrooms');
        break;

        case "feelingFull":
        flags.feelingFull = true;
        contextAction('Feeling full');
        break;

        case "completelyFull":
        flags.completelyFull = true;
        contextAction('Completely full');
        break;

        case "wispApproach":
        flags.wispApproach = true;
        contextAction('Wisp approach');
        break;

        case "beginRefining":
        flags.beginRefining = true;
        contextAction('Begin Refining');
        break;

        case "slowRefining":
        flags.slowRefining = true;
        contextAction('Slow Refining');
        break;

        case "doneRefining":
        flags.doneRefining = true;
        //flags.canRefine = true;
        contextAction('Done Refining');
        break;

        case "canDrawAir":
        flags.canDrawAir = true;
        contextAction('Can draw air');
        break;

        case "waterFound":
        flags.waterFound = true;
        contextAction('Water found');
        break;

    }
}

// function refine()
// called in gameLoop every game tick if player.refining == true
// calls removeCorruption(value), passing player.refineRate
// also increases player.maxEssence by the same amount (may be changed)
// sets player.refining to false if there is no more corruption to remove
// also triggers refining-related flags and upgrade unlocks
function refine(){
    if(player.totalCorruption == 0){
        toggleRefine();

        if(!flags.doneRefining){
            triggerFlag('doneRefining');
        }
        return;
    }
   
    var amountRemoved = removeCorruption(player.refineRate);
    player.maxEssence = round(player.maxEssence + (amountRemoved * player.maxEssenceRefineIncrease));

    if(!flags.beginRefining && player.maxEssence >= 50.5){
        triggerFlag("beginRefining");
    }
}

// function debugShortcut()
// called when certain button on keyboard is pressed
// used to fast-forward to certain points to facilitate testing
function debugShortcut(){
    player.essenceTypes[0] = 26;
    player.corruptionTypes[0] = 0;
    flags.findMoreMushrooms = true;
    flags.mushroomsFoundAgain = true;
    flags.tastyMushrooms = true;
    flags.feelingFull = true;
    flags.completelyFull = true;
    flags.wispApproach = true;
    flags.wispLineNumber = 18;
    player.influence = 15;
    areaOfInfluence.mushrooms = 6;
    $("#eatMushroom").css("display", "inline-block");
    $("#searchButton").css("display", "inline-block");
    $("#refineButton").css("display", "inline-block");
    $("#contextButton").css("display", "none");
    $("#essenceVisual").css("display", "inline-block");
    $("#upgradeTab").css("display","inline-block");
    refineUpgrade0.unlock();
    refineUpgrade1.unlock();
    eatMultipleUpgrade.unlock();
    updateStats();
    wispConversation();
}

// function addNewMessage(messageText, messageClass)
// accepts two string parameters
// messageText dictates what the message should say
// messageClass dictates what css class applies to the message
// pushes the new message to $("#messageWindow") and darkens the text of the last message
function addNewMessage(messageText, messageClass){
    var $newMessageDiv = $("<div></div>");
    var $newMessage = $("<p></p>");
    var $messageWindow = $("#messageWindow");

    $newMessage.text(messageText);
    $newMessage.addClass(messageClass);

    $("#messageWindow p:first-child").addClass("oldMessage");
    
    $newMessageDiv.append($newMessage);
    $messageWindow.prepend($newMessageDiv);

    if($("#messageWindow div").length > 30){
        $("#messageWindow div:last-child").remove();
    }

    return $newMessage;
}

// function checkRank()
// called every gameLoop
// compares player.greatestEssence with the RANK_THRESHOLDS and updates player.rank accordingly
function checkRank(){
    var logEssence = Math.log10(player.greatestEssence);
    var letterRank;
    var maxThreshold;
    var numberRank;

    for (var i = 0; i < RANKS.length; i++){
        if(logEssence > Math.log10(RANK_THRESHOLDS[i])){
            letterRank = RANKS[i];
            maxThreshold = RANK_THRESHOLDS[i];
        }
        else break;
    }
    numberRank = Math.floor(logEssence - Math.log10(maxThreshold));
    if(numberRank > 9){
        numberRank = 9;
    }
    player.rank = letterRank + numberRank;
    $("#rank").text(player.rank);
}

// function checkUpgradeUnlock()
// runs through locked upgrades and tests for their unlock conditions
// unlocks any locked upgrades that have their conditions met
function checkUpgradeUnlock(){
    for (var i = 0; i < allUpgrades.length; i++){
        if(!allUpgrades[i].unlocked && allUpgrades[i].unlockConditions()){
            allUpgrades[i].unlock();
        }
    }
}

// gameLoop
setInterval(function() {
    //flag queries
    if(!flags.findMoreMushrooms && player.essenceTypes[0] == 3){
        triggerFlag("findMoreMushrooms");
    }

    if(!flags.mushroomsFoundAgain && player.influence >= 3){
        triggerFlag("mushroomsFoundAgain");
    }

    if(!flags.tastyMushrooms && player.totalEssence >= 20){
        triggerFlag("tastyMushrooms");
    }

    if(!flags.feelingFull && player.totalEssence >= 35){
        triggerFlag("feelingFull");
    }

    if(!flags.waterFound && areaOfInfluence.waterArea > 0){
        triggerFlag("waterFound");
    }

    //remove corruption from current Essence at rate of 0.05/sec
    if(player.refining){
        refine();
    }

    //draw essence from nature sources
    if(player.drawing != null){
        draw(player.drawing);
    }

    //expand influence over time
    if(player.increasingInfluence){
        increaseInfluence(player.increaseInfluenceRate);
    }

    //updates
    updateStats();  

    //upgrade unlock condition check
    checkUpgradeUnlock();
    
    //check affordability
    for(var i = 0; i < unlockedUpgrades.length; i++){
        unlockedUpgrades[i].checkAffordability();
    }

    //check rank thresholds
    checkRank();

}, 1000);

// holds the actions for each stage of the wisp conversation
var wisp = [
    function(){
        addNewMessage("Look, I know you're new to this whole Dungeon Core thing, but that's what I'm here for!", "wispMessage");
    },
    function(){
        addNewMessage("Just give me some of your Essence real quick, before you hurt yourself!", "wispMessage");
        clearInterval(flags.runWispMessage);
        $("#contextButton").text("Uh... Okay...?");
        $("#contextButton").css("display" , "inline-block");
        $("#contextButton").attr("onclick", "wispConversation()");
    },
    function(){
        addNewMessage("Uh... Okay...?", "selfMessage");
        flags.runWispMessage = setInterval(wispConversation, 5000);
        $("#contextButton").css("display" , "none");
        removeEssence([20, 0, 0, 0, 0, 0]);
        removeCorruption([20, 0,0,0,0,0]);
        addNewMessage("Blegh! This stuff is, like, pure Corruption! Have you not been refining this at all?", "wispMessage");
    },
    function(){
        addNewMessage("Oh, duh, of course you haven't. Okay, well, we gotta take care of that first.", "wispMessage");
    },
    function(){
        addNewMessage("Look into your Center, can you feel all that energy swirling around inside? That's Essence, the energy that makes up everything in the universe.", "wispMessage");
        $("#essenceVisual").css("display" , "block");
    },
    function(){
        addNewMessage("Everything can only hold a certain amount of Essence, and your body is a pretty rough gem right now so it can't handle a lot.", "wispMessage");
    },
    function(){
        addNewMessage("Naturally-occurring Essence, like the stuff you're sucking out of those mushrooms, comes with Corruption, kinda like tainted Essence.", "wispMessage");
    },
    function(){
        addNewMessage("See how dark the Essence inside of you is? That's how bad of a Corruption concentration you've got. Too much Corruption will kill you, so let's fix that.", "wispMessage");
    },
    function(){
        addNewMessage("The process of pulling out the Corruption so that you're left with pure Essence is called Refinement. Give it a try!", "wispMessage");
        $("#refineButton").css("display", "inline-block");
        clearInterval(flags.runWispMessage);
    },
    function(){
        addNewMessage("Once you get all the Corruption out of you, we'll focus on making sure you don't get too much in you in the first place.", "wispMessage");
    },
    function(){
        addNewMessage("Forcibly ripping Essence out of something is fine to get a bunch at once, but then you've gotta refine it all before it's any kind of useful.", "wispMessage");
    },
    function(){
        addNewMessage("Plus, when you tear out all of these mushrooms' Essence, you kill them. See how they're all withering away?", "wispMessage");
    },
    function(){
        addNewMessage("Wouldn't it be better to get the mushrooms to continuously feed you their extra Essence? Then you can refine it as it comes in and focus on more interesting stuff.", "wispMessage");
    },
    function(){
        addNewMessage("Oh, also, the process of refinement concentrates the Essence, making it more dense and compact inside you.", "wispMessage");
    },
    function(){
        addNewMessage("You may have noticed that it looks like you're losing Essence, but it's actually that you're able to hold a little more now that it's refined.", "wispMessage");
    },
    function(){
        addNewMessage("Right now you'll probably only be able to refine it so far, so you'll reach your capacity eventually, but you'll be able to vastly improve that later.", "wispMessage");
    },
    function(){
        addNewMessage("Alright, I'll leave you to it. I'll talk to you again when you've got all your Essence fully refined.", "wispMessage");
        clearInterval(flags.runWispMessage);
    },
    function(){
        if(refineUpgrade0.purchased){
            addNewMessage("Interesting... It looks like you've been able to use your Essence to help your refinement, right?", "wispMessage");
        }
        else{
            flags.wispLineNumber += 1;
        }
    },
    function(){
        addNewMessage("Pretty creative! Keep up that experimenting, I bet you could come up with some pretty cool techniques!", "wispMessage");
    },
    function(){
        addNewMessage("Now that you've cleared out all that Corruption, you should be okay to keep munching on mushrooms for a bit.", "wispMessage");
    },
    function(){
        addNewMessage("Just make sure to keep refining when it looks like you're getting a high concentration of Corruption, or else you probably won't be able to get any more Essence. Plus you'll just feel really gross.", "wispMessage");
    },
    function(){
        addNewMessage("Now lemme tell you a little more about Essence. There are six main elements of Essence: Earth, Fire, Air, Water, Celestial, and Infernal.", "wispMessage");
        flags.essenceTypesKnown = true;
        $("#generalBar").css("display", "none");
    },
    function(){
        addNewMessage("These Elements are found in different concentrations across nature. For example, these mushrooms contain Earth Essence pretty much exclusively.", "wispMessage");
    },
    function(){
        addNewMessage("More complex things can have multiple Elements at once, in varying concentrations.", "wispMessage");
    },
    function(){
        addNewMessage("As you learn more about the world, you should be able to get better at using and combining the Elements, letting you make and modify your own creations.", "wispMessage");
    },
    function(){
        addNewMessage("Now, try drawing on the air around you, see if you can get any Air essence to work with.", "wispMessage");
        $("#drawTab").css("display", "block");
        $("#draw_air").css("display", "inline-block");
        clearInterval(flags.runWispMessage);
    },
    function(){
        addNewMessage("As you can see, drawing from the most basic form of an element will be very slow, but until you can create your own generators for that element, it's all you'll have to rely on.", "wispMessage");
    },
    function(){
        addNewMessage("But now you've got two different elements to work with!", "wispMessage");
    },
    function(){
        addNewMessage("Actually, I'm pretty sure I saw a small stream not far from here as I was flying in, so I bet if you expand your Influence a little further you'd be able to draw from that too!", "wispMessage");
    },
    function(){
        addNewMessage("Oh, sorry, I keep forgetting I'm throwing new terms at you. Your Influence is the area that you've infused with your Essence.", "wispMessage");
        flags.influenceKnown = true;
        $("#searchButton").text("Increase Influence");
        //$("#influenceVisual").css("display", "block");
    },
    function(){
        addNewMessage("For a Dungeon Core like you, your area of Influence is basically like an extension of your body. You're able to directly interact with anything that falls within it.", "wispMessage");
    },
    function(){
        addNewMessage("There's exceptions to this, of course, but we'll get to those eventually. For now, keep expanding your Influence and you should eventually come across that stream.", "wispMessage");
        clearInterval(flags.runWispMessage);
    },
    function(){
        addNewMessage("Great, you've brought some of the river under your Influence! Now you've got three Elements to work with.", "wispMessage");
    },
    function(){
        addNewMessage("Unfortunately, I don't know of any natural sources of Fire, Celestial, or Infernal sources around here, unless there's a lava flow somewhere in this mountain you're stuck in.", "wispMessage");
    },
    function(){
        addNewMessage("But three Elements should be plenty to be able to start making a Dungeon and attracting adventurers, and then you'll have all the Essence you could want!", "wispMessage");
    },
    function(){
        addNewMessage("You're still not quite strong enough to be able to create any decent mobs yet, though, so keep on drawing, eating, and experimenting.", "wispMessage");
        clearInterval(flags.runWispMessage);
    },
    function(){
        addNewMessage("Ah, yep, remember how I said you'd only be able to refine your Essence so far? Looks like you've hit that limit.", "wispMessage");
    },
    function(){
        addNewMessage("Don't worry though, I was anticipating this and thought about what you could do to get past that problem.", "wispMessage");
    },
    function(){
        addNewMessage("Right now your body is a seriously flawed gem core. Higher quality gems can hold more Essence, so you've gotta improve your body somehow.", "wispMessage");
    },
    function(){
        addNewMessage("You're pretty quick at figuring out how to use your Essence in unique ways, so I bet you could put that wit to good use.", "wispMessage");
    },
    function(){
        addNewMessage("Remember, you're trying to repair the flaws in your gem body, but if you make a mistake, you could end up hurting your overall ability to store Essence, so be careful.", "wispMessage");
    },
    function(){
        addNewMessage("Okay, I'll be quiet for a bit to let you concentrate. Good luck!", "wispMessage");
        clearInterval(flags.runWispMessage);
    },
]