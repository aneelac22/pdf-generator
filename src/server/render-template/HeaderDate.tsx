import getHeaderDate from './getHeaderDate';

const HeaderDate = () => (
  <div
    style={{
      marginLeft: 'auto',
    }}
  >
    <p>
      Prepared: <span>{getHeaderDate()}</span>
    </p>
  </div>
);

export default HeaderDate;
