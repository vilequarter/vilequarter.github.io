var allUpgrades = [];
var unlockedUpgrades = [];

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
            //removeCorruption(this.corrCost);
            this.activateEffect();
            this.purchased = true;
            this.$button.remove();
            //this.$button.css("display", "none");
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

//Upgrades

var refineUpgrade0 = new Upgrade("refine", "Better Refining", "Use some Essence to double the rate of Essence refinement", "It's like a Brita filter, but for Essence", [5, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], "refineUpgrade0");
refineUpgrade0.activateEffect = function(){ player.refineRate *= 2 };
refineUpgrade0.unlockConditions = function() {return (!flags.slowRefining && player.maxEssence >= 53.5)};
refineUpgrade0.unlockEffects = function() {
    addNewMessage("I think I'm starting to get a hang of this refining thing. I think I can make it faster if I just nudge some of the Essence like this...", "selfMessage");
    $("#upgradeTab").css("display", "table");
}

var refineUpgrade1 = new Upgrade("refine", "Forced Refining", "Make some Essence blast out the Corruption, tripling the rate of Essence refinement", "Like blowing a golf ball through a garden hose", [15, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], "refineUpgrade1");
refineUpgrade1.activateEffect = function(){ player.refineRate *= 3 };
refineUpgrade1.unlockConditions = function(){ return (refineUpgrade0.purchased && player.maxEssence >= 57)};
refineUpgrade1.unlockEffects = function() {
    addNewMessage("Alright, refining is getting boring. Let's get this over with.", "selfMessage");
}