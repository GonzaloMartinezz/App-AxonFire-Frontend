import ModalRevisionBolsos, { useRevisionBolsos } from '../components/ModalRevisionBolsos';

// En el componente:
const revisionBolsos = useRevisionBolsos();

// Cuando la alerta se resuelve:
revisionBolsos.mostrar({ token, navigation });

// En el JSX:
<ModalRevisionBolsos estado={revisionBolsos} />