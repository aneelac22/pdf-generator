const getHeaderDate = () => {
  const date = new Date();
  const day = date.getDate();
  const year = date.getFullYear();
  return `${day} ${date.toLocaleString('en-us', {
    month: 'short',
  })} ${year} ${date.toLocaleString('en-us', {
    hour: '2-digit',
    hour12: false,
    minute: 'numeric',
  })} UTC`;
};

export default getHeaderDate;
