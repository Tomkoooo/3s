import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import updateLocale from "dayjs/plugin/updateLocale"
import weekday from "dayjs/plugin/weekday"
import weekOfYear from "dayjs/plugin/weekOfYear"
import isBetween from "dayjs/plugin/isBetween"
import "dayjs/locale/hu"

dayjs.extend(updateLocale)
dayjs.extend(relativeTime)
dayjs.extend(weekday)
dayjs.extend(weekOfYear)
dayjs.extend(isBetween)

dayjs.updateLocale("hu", {
    months: ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"],
    monthsShort: ["Jan", "Feb", "Már", "Ápr", "Máj", "Jún", "Júl", "Aug", "Sze", "Okt", "Nov", "Dec"],
    weekdays: ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"],
    weekdaysShort: ["Vas", "Hét", "Ked", "Sze", "Csü", "Pén", "Szo"],
    weekdaysMin: ["V", "H", "K", "Sze", "Cs", "P", "Szo"],
    weekStart: 1,
})

dayjs.locale("hu")

export default dayjs;