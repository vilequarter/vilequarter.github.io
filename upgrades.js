//var allUpgrades = [];
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

    //allUpgrades.push(this);
}

//Upgrades
var upgradeList = {

/*
    Name: {
        type: ,
        name: ,
        description: ,
        flavorText: ,
        cost: {
            essence: {

            },
            corruption: {

            }
        },
        htmlElement: ,
        unlocked: false,
        purchased: false,
        effect: function(){

        },
        unlockConditions: {

        },
        unlockEffects: function(){

        }
    }
*/

    BetterRefining: {
        type: "refine",
        name: "Better Refining",
        description: "Use some Essence to double the rate of Essence refinement",
        flavorText: "It's like a Brita filter, but for Essence",
        cost: {
            essence: {
                earth: 5
            }
        },
        htmlElement: "BetterRefining",
        unlocked: false,
        purchased: false,
        effect: function(){
            player.refineRate *= 2;
        },
        unlockConditions: {
            maxEssence: 53.5,
            flags: "slowRefining"
        },
        unlockEffects: function(){
            addNewMessage("I think I'm starting to get a hang of this refining thing. I think I can make it faster if I just nudge some of the Essence like this...", "selfMessage");
            $("#upgradeTab").css("display", "table");
        }
    },

    ForcedRefining: {
        type: "refine",
        name: "Forced Refining",
        description: "Make some Essence blast out the Corruption, tripling the rate of Essence refinement",
        flavorText: "Like blowing a golf ball through a garden hose",
        cost: {
            essence: {
                earth: 15
            }
        },
        htmlElement: "ForcedRefining",
        unlocked: false,
        purchased: false,
        effect: function(){
            player.refineRate *= 3;
        },
        unlockConditions: {
            maxEssence: 57,
            purchased: "BetterRefining"
        },
        unlockEffects: function(){
            addNewMessage("Alright, refining is getting boring. Let's get this over with.", "selfMessage");
        }
    },

    WindyRefining: {
        type: "refine",
        name: "Windy Refining",
        description: "Use a little Air Essence to spin your Center at high speeds, tripling the rate of Essence refinement",
        flavorText: "You know those videos where they blow pressurised air on a wheel? Yeah, like that",
        cost: {
            essence: {
                air: 3
            }
        },
        htmlElement: "WindyRefining",
        unlocked: false,
        purchased: false,
        effect: function(){
            player.refineRate *= 3;
        },
        unlockConditions: {
            maxEssence: 100,
            essence:{
                air: 1
            },
            purchased: "ForcedRefining"
        },
        unlockEffects: function(){
            addNewMessage("Time to put this newfangled Air Essence to good use.", "selfMessage")
        }
    },

    EfficientRefining: {
        type: "refine",
        name: "Efficient Refining",
        description: "Compact your Essence further when refining",
        flavorText: "Getting the most out of every drop",
        cost: {
            essence: {
                earth: 25
            }
        },
        htmlElement: "EfficientRefining",
        unlocked: false,
        purchased: false,
        effect: function(){
            player.maxEssenceRefineIncrease *= 2;
        },
        unlockConditions: {
            purchased: "SelectiveMunching"
        },
        unlockEffects: null
    },

    SelectiveMunching: {
        type: "corruption",
        name: "Selective Munching",
        description: "You're able to eat around the Corruption a little bit better when pulling it out of stuff",
        flavorText: "I just avoid the moldy bits, it's fine",
        cost: {
            essence: {
                earth: 30
            }
        },
        htmlElement: "SelectiveMunching",
        unlocked: false,
        purchased: false,
        effect: function(){
            player.corruptionReceived = round(player.corruptionReceived * 0.75);
        },
        unlockConditions: {
            maxEssence: 80
        },
        unlockEffects: function(){
            addNewMessage("I'm getting better at recognizing the Corruption within the Essence out there.", "selfMessage")
        }
    },

    ConcentratedExpansion: {
        type: "influence",
        name: "Concentrated Expansion",
        description: "Unlock the ability to focus on expanding your Influence over time. You can only concentrate on one action (refining/drawing/expanding) at a time",
        flavorText: "It's like my mind is swelling to fill the universe",
        cost: {
            essence: {
                earth: 35,
                air: 5
            }
        },
        htmlElement: "ConcentratedExpansion",
        unlocked: false,
        purchased: false,
        effect: function(){
            //change function of the "search" button
            $("#searchButton").attr("onclick","toggleIncreaseInfluence()")
        },
        unlockConditions: {
            influence: 40
        },
        unlockEffects: function(){
            addNewMessage("What if I use the Essence's natural tendency to push outward in order to expand my Influence?", "selfMessage")
        }
    },

    BetterDraw: {
        type: "draw",
        name: "Better Draw",
        description: "Multiply the base rate of drawing from natural sources by ten",
        flavorText: "Go fish",
        cost: {
            essence: {
                air: 5
            }
        },
        htmlElement: "BetterDraw",
        unlocked: false,
        purchased: false,
        effect: function(){
            player.drawRate *= 10;
        },
        unlockConditions: {
            essenceDrawn: 10
        },
        unlockEffects: null
    },

    EatMultipleMushrooms: {
        type: "misc",
        name: "Eat Multiple Mushrooms",
        description: "Spread your awareness to be able to consume multiple mushrooms at once",
        flavorText: "I've got a big mouth",
        cost: {
            essence: {
                earth: 25
            }
        },
        htmlElement: "EatMultipleMushrooms",
        unlocked: false,
        purchased: false,
        effect: function(){
            //display the multiple eat buttons
            $("#eatMultiple").css("display", "inline-block");
            $("#eat10percent").css("display", "inline-block");
            $("#eat25percent").css("display", "inline-block");
            $("#eat50percent").css("display", "inline-block");
            $("#eatAll").css("display", "inline-block");
        },
        unlockConditions: {
            maxEssence: 50
        },
        unlockEffects: function(){
            addNewMessage("You know what, I bet I could pull the Essence from all these mushrooms at once if I concentrated...", "selfMessage")
        }
    },


}

function checkUnlock(obj){
    if(obj.unlocked) return;
    for(condition in obj.unlockConditions){        
        var amount = obj.unlockConditions[condition];
        if(typeof amount === 'string'){ //flag or upgrade purchased
            if(!checkFlags(amount) && !checkUpgradesPurchased(amount)) return false;
        }
        else{ //resource
            var playerStat = player[condition];
            if(typeof playerStat === 'undefined') return false; //resource doesn't exist in player variable
            else if(typeof playerStat === 'function') playerStat = playerStat(); //totalEssence, totalCorruption
            if (playerStat < amount) return false; //not enough of resource
        }
    }
    return true;
}

function checkFlags(name){
    var f = flags[name];
    if(typeof f === 'undefined') return false;
    return f;
}

function checkUpgradesPurchased(name){
    var u = upgradeList[name];
    if(typeof u === 'undefined') return false;
    return u.purchased;
}

function createUpgrades(){
    for (upg in upgradeList){
        upg.buy = function(){
            if(canAfford(upg)){
                processCost(upg);
                upg.activateEffect();
                upg.purchased = true;
                upg.$button.remove();
                //upg.$button.css("display", "none");
            }
        }
        upg.unlock = function(){
            if(!upg.unlocked){
                upg.$button.css("display", "inline-block");
                upg.unlocked = true;
                unlockedUpgrades.push(this);
                if(upg.unlockEffects != null){
                    upg.unlockEffects();
                }
            }
        }
    
        upg.$button = $("<button/>");
        upg.$button
            .css("display", "none")
            .attr("onclick", id + ".buy()")
            .addClass("upgradeButton cannotAfford");
        upg.$title = $("<p></p>");
        upg.$title
            .text(upg.name)
            .addClass("upgradeTitle");
        upg.$description = $("<p></p>");
        upg.$description
            .text(upg.description)
            .addClass("upgradeDescription");
        upg.$cost = null;
        if(flags.exactMeasurementsKnown){
            upg.$cost = $("<p></p>");
            upg.$cost
                .text(costString(upg))
                .addClass("upgradeCost");
        }
        upg.$flavorText = $("<p></p>");
        upg.$flavorText
            .text(upg.flavorText)
            .addClass("flavorText");
    
        upg.$button.append(upg.$title, upg.$description, upg.$cost, upg.$flavorText);
        
        $upgradeTab.append(upg.$button);
        
        upg.checkAffordability = function(){
            if(canAfford(upg)){
                upg.$button.addClass("canAfford");
                upg.$button.removeClass("cannotAfford");
            }
            else{
                upg.$button.addClass("cannotAfford");
                upg.$button.removeClass("canAfford");
            }
        }
    }
}