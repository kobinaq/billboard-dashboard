import { addMonths, diffInDays, endOfMonth, startOfMonth } from "./utils";

export function getClientVisibleContracts(contracts, profile) {
  return (contracts || []).filter((contract) => {
    const linkedProfileId = contract.clients?.profile_id;
    if (linkedProfileId && profile?.id) {
      return linkedProfileId === profile.id;
    }

    return (
      contract.clients?.contact_email?.toLowerCase() === profile?.email?.toLowerCase() ||
      contract.clients?.company_name === profile?.company_name
    );
  });
}

export function buildContractTimeline(contracts) {
  if (!contracts?.length) {
    return null;
  }

  const starts = contracts.map((contract) => new Date(contract.start_date));
  const ends = contracts.map((contract) => new Date(contract.end_date));
  const start = startOfMonth(new Date(Math.min(...starts.map((date) => date.getTime()))));
  const end = endOfMonth(new Date(Math.max(...ends.map((date) => date.getTime()))));

  const months = [];
  let cursor = startOfMonth(start);

  while (cursor <= end) {
    const monthStart = new Date(cursor);
    const monthEnd = endOfMonth(cursor);
    const visibleEnd = monthEnd > end ? end : monthEnd;
    months.push({
      key: `${monthStart.getFullYear()}-${monthStart.getMonth()}`,
      date: monthStart,
      days: diffInDays(monthStart, visibleEnd) + 1
    });
    cursor = addMonths(cursor, 1);
  }

  const grouped = contracts.reduce((accumulator, contract) => {
    const key = contract.billboards?.name || "Unassigned board";
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(contract);
    return accumulator;
  }, {});

  return {
    start,
    end,
    totalDays: diffInDays(start, end) + 1,
    months,
    grouped
  };
}
