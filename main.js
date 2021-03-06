function main() {
    console.log("main is running")
    calculateCountryPoints()
    calculateFactionPoints()

    tableSection.innerHTML = factionTablesHtml()
    periodSection.innerHTML = influenceHistoryHtml()
}

// Data Logic
// Actual data is at the bottom of the page
let totalPoints = 0

class Faction {
    constructor(key, name, points = 0) {
        this.key = key
        this.name = name
        this.points = points
        this.pointMultiplier = 1
        this.shareOfPoints = () => {
            return Math.round(this.points / totalPoints * 100)
        }
        this.memberCountries = []
    }
}

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

// This is used to modify the influence of a country within a faction
class InfluenceShift {
    constructor(country, factionKey, amountOfPoints) {
        this.country = country
        this.factionKey = factionKey
        this.amountOfPoints = amountOfPoints
    }
}

// This is used to store all the influence shifts within a faction within a period
class InfluenceShiftBulk {
    constructor(factionKey, influenceData) {
        this.faction = factions[factionKey]
        this.influenceShiftArray = []
        for (let influenceDatum of influenceData) {
            this.influenceShiftArray.push(
                new InfluenceShift(influenceDatum[0], factionKey, influenceDatum[1])
            )
        }
    }
}

// This is used to modify the overall influence of a faction only once
class FactionShift {
    constructor(factionKey, multiplier) {
        this.factionKey = factionKey
        this.multiplier = multiplier
    }
}

// This modifies a permanent modifier to a faction making it more/less powerful
class PermanentFactionShift {
    constructor(factionKey, multiplier, retroactive = false) {
        this.factionKey = factionKey
        this.multiplier = multiplier
        // If it is retroactive, then it also multiplies all the
        // current influence of all members by the multiplier.
        // Otherwise it only applies the modifier to subsequent shifts.
        this.retroactive = retroactive
    }
}

class Period {
    constructor(
        name,
        description,
        influenceShifts = [],
        factionShifts = [],
        permanentFactionShifts = []
    ) {
        this.name = name
        this.description = description
        this.influenceShifts = influenceShifts
        this.factionShifts = factionShifts
        this.permanentFactionShifts = permanentFactionShifts
    }
}

function shiftInfluence(influenceShift) {
    let countryFaction = influenceShift.country.factions[influenceShift.factionKey]
    let faction = factions[influenceShift.factionKey]

    countryFaction.points += influenceShift.amountOfPoints * faction.pointMultiplier
}

function shiftFactionInfluence(factionShift) {
    for (let country of factions[factionShift.factionKey].memberCountries) {
        country.factions[factionShift.factionKey].points *= factionShift.multiplier
    }
}

function enactPermanentFactionShift(permanentFactionShift) {
    factions[permanentFactionShift.factionKey].pointMultiplier =
        permanentFactionShift.multiplier
    if (permanentFactionShift.retroactive) {
        shiftFactionInfluence(permanentFactionShift)
    }
}

function calculateCountryPoints() {
    for (let period of influenceHistory) {
        for (let influenceShiftBulk of period.influenceShifts) {
            for (let influenceShift of influenceShiftBulk.influenceShiftArray) {
                shiftInfluence(influenceShift)
            }
        }
        for (let factionShift of period.factionShifts) {
            shiftFactionInfluence(factionShift)
        }
        for (let permanentFactionShift of period.permanentFactionShifts) {
            enactPermanentFactionShift(permanentFactionShift)
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
//// for influence tables
let tableSection = document.getElementById("table-section")
let numOfCols = 3

// Total influence of each country
function tableRowTotalCountryInfluence(country) {
    let tableRow = `
    <tr>
        <td class="country">${country.name}</td>
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
        <td class="country">${country.name}</td>
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
            <th colspan=${numOfCols}>${faction.name}<br>
                <div class="faction-modifier">
                    Modifier: ${multiplierToPercentage(faction.pointMultiplier)}%
                </div>
            </th>
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

//// for influence history
let periodSection = document.getElementById("period-section")

function influenceShiftToHtml(influenceShift) {
    let sign = () => {
        if (influenceShift.amountOfPoints > 0) { return "+" }
        if (influenceShift.amountOfPoints < 0) { return "-" }
        return ""
    }

    return `
    <tr>
        <td>${influenceShift.country.name}</td>
        <td>${sign()}${influenceShift.amountOfPoints} pts</td>
    </tr>
    `
}

function influenceShiftBulkToHtml(influenceShiftBulk) {

    let influenceShiftRows = ""

    for (let influenceShift of influenceShiftBulk.influenceShiftArray) {
        influenceShiftRows += influenceShiftToHtml(influenceShift)
    }

    return `
    <table class="influence-shift">
        <thead>
            <th colspan="3">${influenceShiftBulk.faction.name}</th>
        </thead>
        <tbody>
            ${influenceShiftRows}
        </tbody>
    </table>
    `
}

function multiplierToPercentage(multiplier) {
    let shiftPercentage = 1
    let sign = ""
    if (multiplier < 1) {
        shiftPercentage = Math.round(-((1 - multiplier) * 100))
    } else {
        shiftPercentage = Math.round((multiplier - 1) * 100)
        sign = "+"
    }
    return `${sign}${shiftPercentage}`
}

function factionShiftToHtml(factionShift) {
    let shiftPercentage = multiplierToPercentage(factionShift.multiplier)

    return `
    <tr>
        <td>${factions[factionShift.factionKey].name}</td>
        <td>${shiftPercentage}%</td>
    </tr>
    `
}

function allFactionShiftsToHtml(factionShifts) {
    if (factionShifts.length == 0) {
        return ""
    }

    let factionShiftRows = ""
    for (let factionShift of factionShifts) {
        factionShiftRows += factionShiftToHtml(factionShift)
    }

    return `
    <table class="influence-shift">
        <thead>
            <th colspan="2">Faction wide shifts</th>
        </thead>
        <tbody>
            ${factionShiftRows}
        </tbody>
    </table>
    `
}

function permanentFactionShiftToHtml(permanentFactionShift) {
    return factionShiftToHtml(permanentFactionShift)
}

function allPermanentFactionShiftsToHtml(permanentFactionShifts) {
    if (permanentFactionShifts.length == 0) {
        return ""
    }

    let permanentFactionShiftRows = ""
    for (let permanentFactionShift of permanentFactionShifts) {
        permanentFactionShiftRows += permanentFactionShiftToHtml(permanentFactionShift)
    }

    return `
    <table class="influence-shift">
        <thead>
            <th colspan="2">Permanent modifiers</th>
        </thead>
        <tbody>
            ${permanentFactionShiftRows}
        </tbody>
    </table>
    `
}

function periodToHtml(period) {
    let influenceShiftTables = ""

    for (influenceShiftBulk of period.influenceShifts) {
        influenceShiftTables += influenceShiftBulkToHtml(influenceShiftBulk)
    }


    let periodHtml = `
    <details class="influence-period">
        <summary class="period-name">
            ${period.name}
        </summary>
        <p class="period-description">
            ${period.description}
        </p>
        ${influenceShiftTables}
        ${allFactionShiftsToHtml(period.factionShifts)}
        ${allPermanentFactionShiftsToHtml(period.permanentFactionShifts)}
    </details>
    <br>
    `

    return periodHtml
}

function influenceHistoryHtml() {

    let influenceHistoryHtml = "<h2>History of the Galactic Community</h2>"

    for (let period of influenceHistory) {
        influenceHistoryHtml += periodToHtml(period)
    }

    return influenceHistoryHtml
}


// Data
let factions = {
    spaceWeavers: new Faction("spaceWeavers", "Space Weavers"),

    scientificBond: new Faction("scientificBond", "Scientific Bond")
}

// faction key shorthands
const _spaceWeaverKey = factions.spaceWeavers.key
const _scientificBondKey = factions.scientificBond.key

let countries = {
    // alphabetical order
    kindra: new Country("Osiri Federation", [_spaceWeaverKey]),
    quinny: new Country("Five Banners Privateers", [_spaceWeaverKey, _scientificBondKey]),
    randwarf: new Country("Utopian Project", [_spaceWeaverKey]),
    sari: new Country("Aquan Alliance", [_spaceWeaverKey]),
    spectre: new Country("Tel'Narior", [_scientificBondKey]),
    stooser: new Country("Ultravisionary", [_scientificBondKey]),
    wiggen: new Country("Vrinn United", [_spaceWeaverKey, _scientificBondKey])
}

let periods = {
    period2310s: new Period(
        "The 2310s",

        `The <b>Space Weavers</b>, a decades old galactic trading organisation, is on the rise as they seek out increased membership through the
        entire galaxy.<br>

        The Ultravisionary creates the <b>Scientific Bond</b>. Still a budding project of a single country and therefore not yet present on the 
        galactic stage, many nations have shown interest to it and will likely join, making it part of the Galactic Community.`,
        [
            new InfluenceShiftBulk(_spaceWeaverKey,
                [
                    [countries.sari, +250],
                    [countries.randwarf, +290],
                    [countries.quinny, +240],
                    [countries.kindra, +90],
                    [countries.wiggen, +50]
                ]
            ),

            new InfluenceShiftBulk(_scientificBondKey,
                [
                    [countries.stooser, +200],
                    [countries.quinny, +100],
                    [countries.spectre, +100],
                    [countries.wiggen, +100]
                ]
            )
        ],
        [],
        [
            new PermanentFactionShift(_scientificBondKey, 0.5, true)
        ]
    ),

    period2320s: new Period(
        "2320s",

        `Work in progress: roleplay still has to be done
        `,
        [
            new InfluenceShiftBulk(_spaceWeaverKey,
                [
                    [countries.randwarf, +87 + 20], // Trade, CGs
                    [countries.quinny, +128],
                    [countries.sari, +40],
                    [countries.kindra, +14],
                    // +50 for now being an established member
                    [countries.wiggen, +145, +50]
                ]
            ),

            new InfluenceShiftBulk(_scientificBondKey,
                [
                    [countries.stooser, +0],
                    [countries.quinny, +0],
                    [countries.spectre, +0],
                    [countries.wiggen, +0]
                ]
            )
        ]
    )
}

let influenceHistory = [
    periods.period2310s,
    periods.period2320s
]

main()
