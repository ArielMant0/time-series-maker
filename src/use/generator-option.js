const VALIDATORS = Object.freeze({
    EXCLUSIVE_0_1: value => value > 0 && value < 1,
    NOT_ZERO: value => value !== 0,
    POSITIVE: value => value > 0,
    INTEGER: value => Number.isInteger(value)
});
const VALIDATOR_IDS = Object.keys(VALIDATORS);

const DEFAULT_OPTIONS = {
    min: -Infinity,
    max: Infinity,
    step: 0.1,
    validators: [],
}

function rangeToString(min, max, validators) {

    let minVal = min;
    let maxVal = max;
    let left = Number.isFinite(min) ? "[" : "(";
    let right = Number.isFinite(max) ? "]" : ")";

    if (validators.includes("EXCLUSIVE_0_1")) {
        left = "(";
        right = ")";
        minVal = Math.max(minVal, 0);
        maxVal = Math.min(maxVal, 1);
    } else if (validators.includes("POSITIVE")) {
        left = "(";
        minVal = Math.max(minVal, 0);
    }
    if (!Number.isFinite(minVal)) { minVal = "-&infin;" }
    if (!Number.isFinite(maxVal)) { maxVal = "+&infin;" }

    return `x &isinv; ${left}${minVal}, ${maxVal}${right}`
}
function validatorsToString(validators) {
    return validators.map(v => {
        switch(v) {
            case "NOT_ZERO": {
                return validators.includes("EXCLUSIVE_0_1") || validators.includes("POSITIVE") ?
                    "x > 0" : "x &ne; 0"
            }
            case "INTEGER": return validators.includes("POSITIVE") ? "x &isinv; Z\\{ 0 }" : "x &isinv; Z"
        }
    }).filter(d => d)
}

class GeneratorOption {

    constructor(name, value, options=DEFAULT_OPTIONS, generator=null) {
        this.name = name;
        this.value = value;
        this.title = options.title ? options.title : name;
        this.min = options.min ? options.min : DEFAULT_OPTIONS.min;
        this.max = options.max ? options.max : DEFAULT_OPTIONS.max;
        this.step = options.step ? options.step : DEFAULT_OPTIONS.step;
        this.validators = options.validators ? options.validators : DEFAULT_OPTIONS.validators;
        this.generator = generator;
    }

    setGenerator(generator) {
        this.generator = generator;
    }

    copy() {
        return new GeneratorOption(
            this.name,
            this.value,
            {
                min: this.min,
                max: this.max,
                step: this.step,
                validators: this.validators,
                title: this.title,
            },
            this.generator
        )
    }

    toJSON() {
        return {
            name: this.name,
            value: this.value,
            title: this.title,
            min: this.min,
            max: this.max,
            step: this.step,
            validators: this.validators,
        }
    }

    static fromJSON(json) {
        return new GeneratorOption(
            json["name"],
            json["value"],
            json
        )
    }

    toString(includeName=true) {
        const rstr = rangeToString(this.min, this.max, this.validators);
        const vals = validatorsToString(this.validators).join(" | ");
        if (vals.length > 0) {
            return includeName ? `${this.name}: { ${rstr} | ${vals} }` : `{ ${rstr} | ${vals} }`
        }
        return includeName ? `${this.name}: { ${rstr} }` : `{ ${rstr} }`
    }

    matchesValidators(value=this.value) {
        let valid = true;
        if (this.generator !== null && (this.name === "xMin" || this.name === "xMax")) {
            const other = this.generator.getOpt(this.name === "xMin" ? "xMax" : "xMin");
            if (other !== undefined && other !== null) {
                valid = this.name === "xMin" ? value < other : value > other;
            }
        }
        return valid && !this.validators.some(d => !VALIDATORS[d](value))
    }

    isValid(value=this.value) {
        return !Number.isNaN(value) && this.matchesValidators(value) &&
            (Number.isNaN(this.min) || value >= this.min) &&
            (Number.isNaN(this.max) || value <= this.max) &&
            ((Number.isNaN(this.min) || Number.isNaN(this.max)) || this.min < this.max)
    }
}

export { GeneratorOption as default, VALIDATOR_IDS }