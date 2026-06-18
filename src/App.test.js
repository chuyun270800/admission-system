import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders the system login screen", () => {
  render(<App />);
  expect(screen.getByText(/system login/i)).toBeInTheDocument();
  expect(screen.getByText(/外國學生招生審查平台/i)).toBeInTheDocument();
});
