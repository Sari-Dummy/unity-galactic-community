function main() {
    console.log("main is running")
    calculateCountryPoints()
    calculateFactionPoints()

    tableSection.innerHTML = factionTablesHtml()
}

let totalPoints = 0

class Faction {
    constructor(key, name, points = 0) {
        this.key = key
        this.name = name
        this.points = points
        this.shareOfPoints = () => {
            return Math.round(this.points / totalPoints * 100)
        }
        this.memberCountries = []
    }
}

let factions = {
    spaceWeavers: new Faction("spaceWeavers", "Space Weavers"),

    scientificBond: new Faction("scientificBond", "Scientific Bond"),

    assFaction: new Faction("assFaction", "The Union of Ass")
}

// faction key shorthands
const _spaceWeaverKey = factions.spaceWeavers.key
const _scientificBondKey = factions.scientificBond.key
const _ass = factions.assFaction.key

class FactionOfCountry {
    constructor(factionKey) {
        this.key = factionKey
        this.name = factions[factionKey].name
        this.points = factions[factionKey].points
        this.shareOfPoints = () => {
            return Math.round(this.points / totalPoints * 100)
        }
        this.shareOfPointsInFaction = () => {
            return Math.round(this.points / factions[factionKey].points * 100)
        }
    }
}

class Country {
    constructor(name, countryFactionKeys) {
        this.name = name
        this.factions = new Object()
        countryFactionKeys.forEach(factionKey => {
            this.factions[factionKey] = new FactionOfCountry(factionKey)
            factions[factionKey].memberCountries.push(this)
        })


        this.totalPoints = () => {
            let total = 0
            for (let [key, faction] of Object.entries(this.factions)) {
                total += faction.points
            }
            return total
        }

        this.shareOfPoints = () => {
            return Math.round(this.totalPoints() / totalPoints * 100)
        }
    }
}

let countries = {
    // alphabetical order
    kindra: new Country("Osiri Federation", [_spaceWeaverKey]),
    quinny: new Country("Five Banners Privateers", [_spaceWeaverKey]),
    randwarf: new Country("Utopian Project", [_spaceWeaverKey]),
    sari: new Country("Aquan Alliance", [_spaceWeaverKey, _scientificBondKey]),
    stooser: new Country("Ultravisionary", [_scientificBondKey]),
    wiggen: new Country("Vrinn United", [_spaceWeaverKey]),
    assPlayer: new Country("Mister Ass", [_ass])
}

class InfluenceShift {
    constructor(country, factionKey, amountOfPoints) {
        this.country = country
        this.factionKey = factionKey
        this.amountOfPoints = amountOfPoints
    }
}

class InfluenceShiftsOfFaction {
    constructor(factionKey, influenceData) {
        this.influenceShiftArray = []
        for (let influenceDatum of influenceData) {
            this.influenceShiftArray.push(
                new InfluenceShift(influenceDatum[0], factionKey, influenceDatum[1])
            )
        }
    }
}

class Period {
    constructor(description, influenceShifts) {
        this.description = description
        this.influenceShifts = influenceShifts
    }
}

function shiftInfluence(influenceShift) {
    influenceShift.country.factions[influenceShift.factionKey].points += influenceShift.amountOfPoints
}

let periods = {
    period2322: new Period(
        "The Galactic Community is organically formed as a result of multiple galactic factions rising.",
        [
            new InfluenceShiftsOfFaction(_spaceWeaverKey,
                [
                    [countries.sari, +250],
                    [countries.randwarf, +290],
                    [countries.quinny, +240],
                    [countries.kindra, +90],
                    [countries.wiggen, +100]
                ]
            ),

            new InfluenceShiftsOfFaction(_scientificBondKey,
                [
                    [countries.sari, +100],
                    [countries.stooser, +250]
                ]
            ),

            new InfluenceShiftsOfFaction(_ass,
                [
                    [countries.assPlayer, +200]
                ]
            )
        ]
    )
}

let influenceHistory = [
    periods.period2322
]

function calculateCountryPoints() {
    for (let period of influenceHistory) {
        for (let influenceShiftBulk of period.influenceShifts) {
            for (let influenceShift of influenceShiftBulk.influenceShiftArray) {
                shiftInfluence(influenceShift)
            }
        }
    }
}

function calculateFactionPoints() {
    for (let [key, country] of Object.entries(countries)) {
        for (let [key, faction] of Object.entries(country.factions)) {
            factions[key].points += faction.points
            totalPoints += faction.points
        }
    }
}

// document logic
let tableSection = document.getElementById("table-section")
let numOfCols = 3

// Total influence of each country
function tableRowTotalCountryInfluence(country) {
    let tableRow = `
    <tr>
        <td>${country.name}</td>
        <td>${country.shareOfPoints()}%</td>
        <td>${country.totalPoints()} pts</td>
    </tr>
    `
    return tableRow
}

function tableTotalCountryInfluence() {
    let totalInfluenceTable = ""
    let tableHeader = "Total galactic influence by country"
    let tableRows = ""

    for (let [key, country] of Object.entries(countries)) {
        tableRows += tableRowTotalCountryInfluence(country)
    }

    totalInfluenceTable = `
    <table class="faction-table">
        <thead>
            <th colspan=${numOfCols}>${tableHeader}</th>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>`

    return totalInfluenceTable
}


// Influence of each faction and each country's influence within that faction
function tableRowFactionCountryInfluence(country, factionKey) {
    let htmlToReturn = `
    <tr>
        <td>${country.name}</td>
        <td>${country.factions[factionKey].shareOfPoints()}%</td>
        <td>${country.factions[factionKey].points} pts</td>
        <td>${country.factions[factionKey].shareOfPointsInFaction()} %</td>
    </tr>
    `
    return htmlToReturn
}

function tableFactionInfluence(faction) {
    let factionInfluenceTable = ""
    let tableRows = ""

    let totalInfluence = `
    <tr>
        <td><b>Total faction influence</b></td>
        <td><b>${factions[faction.key].shareOfPoints()}%</b></td>
        <td>${factions[faction.key].points} pts</td>
    </tr>
    `

    tableRows += totalInfluence

    for (let country of faction.memberCountries) {
        tableRows += tableRowFactionCountryInfluence(country, faction.key)
    }

    factionInfluenceTable = `
    <table class="faction-table">
        <thead>
            <th colspan=${numOfCols}>${faction.name}</th>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>`

    return factionInfluenceTable
}


function factionTablesHtml() {
    let factionTables = ""

    factionTables += tableTotalCountryInfluence()

    for (let [key, faction] of Object.entries(factions)) {
        factionTables += tableFactionInfluence(faction)
    }

    return factionTables
}

main()
